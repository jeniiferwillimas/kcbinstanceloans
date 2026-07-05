<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LoanApplication;
use App\Models\LoanType;
use App\Models\Payment;
use App\Models\MpesaStkPushRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MpesaPaymentController extends Controller
{
    protected $apiKey;
    protected $email;
    protected $baseUrl;
    protected $callbackUrl;

    public function __construct()
    {
        $this->apiKey = config('services.megapay.api_key') ?? env('MEGAPAY_API_KEY');
        $this->email = config('services.megapay.email') ?? env('MEGAPAY_EMAIL');
        $this->baseUrl = config('services.megapay.base_url') ?? env('MEGAPAY_BASE_URL', 'https://megapay.co.ke/backend/v1');
        $this->callbackUrl = config('services.megapay.callback_url') ?? env('MEGAPAY_CALLBACK_URL');
    }

    /**
     * Initiate M-PESA STK Push using MegaPay API
     */
    public function initiatePayment(Request $request)
    {
        $request->validate([
            'loan_application_id' => 'nullable|exists:loan_applications,id',
            'amount' => 'required|numeric|min:1',
            'phone_number' => 'required|string',
            'full_name' => 'required|string|max:255',
            'national_id' => ['required', 'string', 'regex:/^\d{7,9}$/'],
            'loan_type' => 'required|exists:loan_types,slug',
        ]);

        // Create or get loan application
        if ($request->filled('loan_application_id')) {
            $application = LoanApplication::find($request->loan_application_id);
        } else {
            $loanType = LoanType::where('slug', $request->loan_type)->first();
            
            $application = LoanApplication::create([
                'full_name' => $request->full_name,
                'phone_number' => $request->phone_number,
                'national_id' => $request->national_id,
                'amount' => $request->amount,
                'interest_rate' => $loanType->interest_rate,
                'term_days' => 180,
                'processing_fee' => $loanType->processing_fee,
                'total_repayment' => 0,
                'status' => 'pending',
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'application_reference' => 'APP-' . Str::random(8),
            ]);
        }

        $phone = $this->formatPhoneNumber($request->phone_number);
        $reference = 'KCBLOAN' . $application->id;

        // Create payment record
        $payment = Payment::create([
            'loan_application_id' => $application->id,
            'amount' => $request->amount,
            'payment_type' => 'processing_fee',
            'payment_method' => 'mpesa',
            'phone_number' => $phone,
            'status' => 'pending',
            'payment_reference' => 'PAY-' . Str::random(10),
        ]);

        try {
            // Call MegaPay API to initiate STK Push
            $response = Http::post($this->baseUrl . '/initiatestk', [
                'api_key' => $this->apiKey,
                'email' => $this->email,
                'amount' => (string) $request->amount,
                'msisdn' => $phone,
                'reference' => $reference
            ]);

            $responseData = $response->json();

            if ($response->successful() && isset($responseData['success']) && $responseData['success'] === '200') {
                // Save STK push record
                $stkPush = MpesaStkPushRequest::create([
                    'payment_id' => $payment->id,
                    'loan_application_id' => $application->id,
                    'phone_number' => $phone,
                    'amount' => $request->amount,
                    'merchant_request_id' => $responseData['transaction_request_id'] ?? null,
                    'checkout_request_id' => $responseData['transaction_request_id'] ?? null,
                    'local_id' => $responseData['transaction_request_id'] ?? null,
                    'status' => 'pending',
                    'request_data' => [
                        'amount' => $request->amount,
                        'phone' => $phone,
                        'timestamp' => now(),
                        'response' => $responseData,
                    ],
                    'sent_at' => now(),
                ]);

                return response()->json([
                    'success' => true,
                    'message' => $responseData['massage'] ?? 'STK Push sent to your phone',
                    'data' => [
                        'payment_id' => $payment->id,
                        'transaction_request_id' => $responseData['transaction_request_id'] ?? null,
                        'status' => 'pending'
                    ]
                ]);
            } else {
                throw new \Exception($responseData['massage'] ?? 'Failed to initiate STK Push');
            }

        } catch (\Exception $e) {
            // Update payment as failed
            $payment->status = 'failed';
            $payment->error_message = $e->getMessage();
            $payment->save();

            return response()->json([
                'success' => false,
                'message' => 'Failed to send STK Push: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Check STK Push status using MegaPay API
     */
    public function checkStatus(Request $request)
    {
        $request->validate([
            'checkout_request_id' => 'required|string'
        ]);

        $stkPush = MpesaStkPushRequest::where('checkout_request_id', $request->checkout_request_id)->first();

        if (!$stkPush) {
            return response()->json([
                'success' => false,
                'message' => 'Transaction not found'
            ], 404);
        }

        try {
            // Call MegaPay API to check transaction status
            $response = Http::post($this->baseUrl . '/transactionstatus', [
                'api_key' => $this->apiKey,
                'email' => $this->email,
                'transaction_request_id' => $request->checkout_request_id
            ]);

            $responseData = $response->json();

            if (!$response->successful() || !isset($responseData['ResultCode'])) {
                throw new \Exception($responseData['ResultDesc'] ?? 'Failed to check transaction status');
            }

            // Determine status based on ResultCode
            $status = $responseData['ResultCode'] == '200' ? 'completed' : 'failed';
            
            $stkPush->status = $status;
            $stkPush->callback_data = $responseData;
            $stkPush->completed_at = now();
            $stkPush->save();

            // Update payment
            $payment = Payment::find($stkPush->payment_id);
            $payment->status = $status;
            $payment->confirmed_at = now();
            
            if ($status == 'completed') {
                $payment->mpesa_receipt_number = $responseData['TransactionReceipt'] ?? null;
                $payment->mpesa_transaction_id = $responseData['TransactionID'] ?? null;
                $payment->save();
                
                // Update loan application
                $application = LoanApplication::find($stkPush->loan_application_id);
                if ($application) {
                    $application->status = 'processing';
                    $application->payment_confirmed_at = now();
                    $application->save();
                }

                // Process loan disbursement
                $this->disburseLoan($application, $payment);
            } else {
                $payment->error_message = $responseData['ResultDesc'] ?? 'Transaction failed';
                $payment->save();
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'status' => $status,
                    'payment_id' => $payment->id,
                    'mpesa_receipt' => $payment->mpesa_receipt_number,
                    'message' => $responseData['ResultDesc'] ?? 'Status checked'
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to check status: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * MegaPay Callback handler
     */
    public function callback(Request $request)
    {
        $data = $request->all();
        
        Log::info('MegaPay Callback received', ['data' => $data]);

        $responseCode = $data['ResponseCode'] ?? null;
        $responseDescription = $data['ResponseDescription'] ?? null;
        $transactionId = $data['TransactionID'] ?? null;
        $checkoutRequestId = $data['CheckoutRequestID'] ?? $data['MerchantRequestID'] ?? null;

        if (!$checkoutRequestId) {
            Log::error('Callback: No transaction ID found', ['data' => $data]);
            return response()->json(['error' => 'Transaction ID not found'], 400);
        }

        $stkPush = MpesaStkPushRequest::where('checkout_request_id', $checkoutRequestId)
            ->orWhere('merchant_request_id', $checkoutRequestId)
            ->first();

        if (!$stkPush) {
            Log::error('Callback: Transaction not found', ['checkoutRequestId' => $checkoutRequestId]);
            return response()->json(['error' => 'Transaction not found'], 404);
        }

        $stkPush->callback_data = $data;
        $status = $responseCode == 0 ? 'completed' : 'failed';
        $stkPush->status = $status;
        $stkPush->completed_at = now();
        $stkPush->save();

        $payment = Payment::find($stkPush->payment_id);
        if ($payment) {
            $payment->status = $status;
            $payment->confirmed_at = now();
            $payment->callback_payload = $data;

            if ($responseCode == 0) {
                $payment->mpesa_receipt_number = $data['TransactionReceipt'] ?? null;
                $payment->mpesa_transaction_id = $data['TransactionID'] ?? null;
                $payment->save();
                
                $application = LoanApplication::find($stkPush->loan_application_id);
                
                if ($application) {
                    $application->status = 'processing';
                    $application->payment_confirmed_at = now();
                    $application->save();
                    $this->disburseLoan($application, $payment);
                }
            } else {
                $payment->error_message = $responseDescription ?? 'Transaction failed';
                $payment->save();
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Callback processed successfully'
        ]);
    }

    /**
     * Disburse loan after successful payment
     */
    private function disburseLoan($application, $payment)
    {
        $disbursement = \App\Models\LoanDisbursement::create([
            'loan_application_id' => $application->id,
            'payment_id' => $payment->id,
            'amount' => $application->amount,
            'phone_number' => $application->phone_number,
            'status' => 'pending',
            'disbursement_reference' => 'DISB-' . Str::random(10),
        ]);

        $this->createRepaymentSchedule($application);

        $application->status = 'active';
        $application->disbursed_at = now();
        $application->save();

        return $disbursement;
    }

    /**
     * Create repayment schedule
     */
    private function createRepaymentSchedule($application)
    {
        $totalMonths = 6;
        $totalAmount = $application->amount + $application->processing_fee;
        $monthlyPayment = $totalAmount / $totalMonths;
        $interest = $application->amount * ($application->interest_rate / 100);
        $totalInterest = $interest;

        for ($i = 1; $i <= $totalMonths; $i++) {
            \App\Models\LoanRepayment::create([
                'loan_application_id' => $application->id,
                'installment_number' => $i,
                'amount' => $monthlyPayment,
                'principal' => $application->amount / $totalMonths,
                'interest' => $totalInterest / $totalMonths,
                'due_date' => now()->addMonths($i),
                'status' => 'pending',
                'repayment_reference' => 'REPAY-' . Str::random(10),
            ]);
        }
    }

    /**
     * Format phone number for MegaPay
     */
    private function formatPhoneNumber($phone)
    {
        $phone = preg_replace('/[^0-9]/', '', $phone);
        
        // If it starts with 254, return as is
        if (substr($phone, 0, 3) === '254') {
            return $phone;
        }
        
        // If it's 11 digits starting with 0 (like 0115020811)
        if (strlen($phone) === 11 && substr($phone, 0, 1) === '0') {
            return $phone;
        }
        
        // If it starts with 0, keep it (for local format)
        if (substr($phone, 0, 1) === '0') {
            return $phone;
        }
        
        // If it starts with 1 (like 115020811), add leading 0
        if (substr($phone, 0, 1) === '1') {
            return '0' . $phone;
        }
        
        // If it starts with 7, add leading 0
        if (substr($phone, 0, 1) === '7') {
            return '0' . $phone;
        }
        
        return $phone;
    }

    /**
     * Handle loan default detection
     */
    public function checkOverdueLoans()
    {
        $overdueRepayments = \App\Models\LoanRepayment::where('status', 'pending')
            ->where('due_date', '<', now()->subDays(30))
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Overdue loans checked',
            'count' => $overdueRepayments->count()
        ]);
    }
}