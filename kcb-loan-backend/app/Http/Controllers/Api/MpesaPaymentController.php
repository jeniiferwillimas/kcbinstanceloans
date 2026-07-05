<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LoanApplication;
use App\Models\LoanType;
use App\Models\Payment;
use App\Models\MpesaStkPushRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;

class MpesaPaymentController extends Controller
{
    /**
     * Initiate payment for processing fee
     */
    public function initiatePayment(Request $request)
    {
        try {
            // Validate
            $validator = Validator::make($request->all(), [
                'full_name' => 'required|string|max:255',
                'phone_number' => 'required|string|max:20',
                'national_id' => 'required|string|max:20',
                'amount' => 'required|numeric|min:1',
                'loan_amount' => 'required|numeric|min:1',
                'loan_type' => 'required|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Get loan type by name or ID (FIXED)
            $loanType = null;
            
            // Check if loan_type is numeric (ID)
            if (is_numeric($request->loan_type)) {
                $loanType = LoanType::find($request->loan_type);
            } else {
                // Search by name (case insensitive)
                $loanType = LoanType::where('name', $request->loan_type)
                    ->orWhere('slug', $request->loan_type)
                    ->first();
            }

            if (!$loanType) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Loan type not found. Available types: Personal Loan, Business Loan, Education Loan, Emergency Loan, Home Improvement'
                ], 404);
            }

            $processingFee = $request->amount;
            $loanAmount = $request->loan_amount;

            // Check if loan exists
            $loan = LoanApplication::where('national_id', $request->national_id)
                ->whereIn('status', ['pending', 'failed'])
                ->first();
            
            if (!$loan) {
                // Calculate using loan type configuration
                $interestRate = $loanType->interest_rate ?? 12.00;
                $termDays = $loanType->term_days ?? 180;
                $totalRepayment = $loanAmount + $processingFee + ($loanAmount * $interestRate / 100);
                
                $loan = LoanApplication::create([
                    'full_name' => $request->full_name,
                    'phone_number' => $request->phone_number,
                    'national_id' => $request->national_id,
                    'loan_type_id' => $loanType->id,
                    'amount' => $loanAmount,
                    'interest_rate' => $interestRate,
                    'term_days' => $termDays,
                    'processing_fee' => $processingFee,
                    'total_repayment' => $totalRepayment,
                    'status' => 'pending',
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent()
                ]);
            } else {
                // If loan exists and is approved, don't allow new application
                if ($loan->status === 'approved') {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'You already have an approved loan'
                    ], 400);
                }
                
                $interestRate = $loanType->interest_rate ?? 12.00;
                $termDays = $loanType->term_days ?? 180;
                $totalRepayment = $loanAmount + $processingFee + ($loanAmount * $interestRate / 100);
                
                $loan->update([
                    'full_name' => $request->full_name,
                    'phone_number' => $request->phone_number,
                    'loan_type_id' => $loanType->id,
                    'amount' => $loanAmount,
                    'interest_rate' => $interestRate,
                    'term_days' => $termDays,
                    'processing_fee' => $processingFee,
                    'total_repayment' => $totalRepayment,
                    'status' => 'pending',
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent()
                ]);
            }

            // Format phone number
            $phone = $this->formatPhoneNumber($loan->phone_number);
            
            // Generate reference
            $reference = 'KCB-LOAN-' . $loan->id . '-' . time();

            // Call Megapay - ONLY for processing fee
            $payload = [
                'api_key' => env('MEGAPAY_API_KEY'),
                'email' => env('MEGAPAY_EMAIL'),
                'amount' => (string) $processingFee,
                'msisdn' => $phone,
                'reference' => $reference
            ];

            Log::info('Calling Megapay for processing fee', [
                'loan_amount' => $loanAmount,
                'processing_fee' => $processingFee,
                'loan_type' => $loanType->name,
                'phone' => $phone
            ]);

            $response = Http::withHeaders([
                'Content-Type' => 'application/json'
            ])->withOptions([
                'verify' => false,
                'timeout' => 30,
            ])->post('https://megapay.co.ke/backend/v1/initiatestk', $payload);

            Log::info('Megapay response', [
                'status' => $response->status(),
                'body' => $response->body()
            ]);

            if (!$response->successful()) {
                throw new \Exception('Megapay API error: ' . $response->body());
            }

            $megapayData = $response->json();

            // Create payment record for processing fee
            $payment = Payment::create([
                'loan_application_id' => $loan->id,
                'amount' => $processingFee,
                'payment_method' => 'mpesa',
                'payment_type' => 'processing_fee',
                'phone_number' => $loan->phone_number,
                'checkout_request_id' => $megapayData['CheckoutRequestID'] ?? null,
                'merchant_request_id' => $megapayData['MerchantRequestID'] ?? null,
                'status' => 'pending',
                'request_payload' => $megapayData,
                'payment_date' => now(),
            ]);

            // Create STK push record
            MpesaStkPushRequest::create([
                'payment_id' => $payment->id,
                'loan_application_id' => $loan->id,
                'merchant_request_id' => $megapayData['MerchantRequestID'] ?? null,
                'checkout_request_id' => $megapayData['CheckoutRequestID'] ?? null,
                'local_id' => null,
                'ld_id' => null,
                'phone_number' => $loan->phone_number,
                'amount' => $processingFee,
                'status' => 'pending',
                'request_data' => $megapayData,
                'sent_at' => now(),
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Processing fee payment initiated. Check your phone for M-Pesa prompt.',
                'data' => [
                    'loan_id' => $loan->id,
                    'loan_type' => $loanType->name,
                    'payment_id' => $payment->id,
                    'checkout_request_id' => $megapayData['CheckoutRequestID'] ?? null,
                    'loan_amount' => $loanAmount,
                    'processing_fee' => $processingFee,
                    'interest_rate' => $loan->interest_rate,
                    'term_days' => $loan->term_days,
                    'total_repayment' => $loan->total_repayment,
                    'status' => 'pending',
                    'next_step' => 'Pay the processing fee of KES ' . number_format($processingFee, 2) . ' to complete your application'
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Payment error: ' . $e->getMessage());
            
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to initiate payment: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Handle M-Pesa callback
     */
    public function handleCallback(Request $request)
    {
        Log::info('Callback received', $request->all());

        try {
            DB::beginTransaction();

            $data = $request->all();
            
            // Find STK push
            $stkPush = MpesaStkPushRequest::where('checkout_request_id', $data['CheckoutRequestID'] ?? null)
                ->orWhere('merchant_request_id', $data['MerchantRequestID'] ?? null)
                ->first();

            if (!$stkPush) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Transaction not found'
                ], 404);
            }

            $isSuccess = ($data['ResultCode'] ?? 1) == 0;
            $status = $isSuccess ? 'completed' : 'failed';

            // Update STK push
            $stkPush->status = $status;
            $stkPush->result_code = $data['ResultCode'] ?? null;
            $stkPush->result_desc = $data['ResultDesc'] ?? null;
            $stkPush->mpesa_receipt_number = $data['CallbackMetadata']['Item'][1]['Value'] ?? null;
            $stkPush->callback_data = $data;
            $stkPush->completed_at = now();
            $stkPush->save();

            // Update payment
            $payment = Payment::find($stkPush->payment_id);
            if ($payment) {
                $payment->status = $status;
                $payment->mpesa_receipt_number = $data['CallbackMetadata']['Item'][1]['Value'] ?? null;
                $payment->callback_payload = $data;
                $payment->confirmed_at = now();
                $payment->save();
            }

            // Update loan
            $loan = LoanApplication::find($stkPush->loan_application_id);
            if ($loan) {
                if ($isSuccess) {
                    // Processing fee paid successfully - APPROVE THE LOAN
                    $loan->status = 'approved';
                    $loan->approved_at = now();
                    
                    Log::info('Processing fee paid. Loan approved.', [
                        'loan_id' => $loan->id,
                        'amount' => $loan->amount,
                        'processing_fee' => $loan->processing_fee,
                        'total_repayment' => $loan->total_repayment,
                        'receipt' => $data['CallbackMetadata']['Item'][1]['Value'] ?? null
                    ]);
                    
                } else {
                    $loan->status = 'failed';
                    
                    Log::warning('Processing fee payment failed', [
                        'loan_id' => $loan->id,
                        'reason' => $data['ResultDesc'] ?? 'Payment failed'
                    ]);
                }
                $loan->save();
            }

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Callback processed'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Callback error: ' . $e->getMessage());
            
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to process callback'
            ], 500);
        }
    }

    /**
     * Check loan status
     */
    public function checkStatus($id)
    {
        $loan = LoanApplication::with('loanType')->find($id);

        if (!$loan) {
            return response()->json([
                'status' => 'error',
                'message' => 'Loan not found'
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'id' => $loan->id,
                'full_name' => $loan->full_name,
                'loan_type' => $loan->loanType->name ?? null,
                'loan_amount' => $loan->amount,
                'interest_rate' => $loan->interest_rate,
                'processing_fee' => $loan->processing_fee,
                'term_days' => $loan->term_days,
                'total_repayment' => $loan->total_repayment,
                'status' => $loan->status,
                'created_at' => $loan->created_at,
                'approved_at' => $loan->approved_at
            ]
        ]);
    }

    /**
     * Format phone number
     */
    private function formatPhoneNumber($phone)
    {
        $phone = preg_replace('/[^0-9]/', '', $phone);
        
        if (substr($phone, 0, 1) === '0') {
            $phone = substr($phone, 1);
        }
        
        return $phone;
    }
}