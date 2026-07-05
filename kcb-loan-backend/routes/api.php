<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\LoanTypeController;
use App\Http\Controllers\Api\LoanApplicationController;
use App\Http\Controllers\Api\MpesaPaymentController;


Route::post('/initiate-payment', [MpesaPaymentController::class, 'initiatePayment']);
Route::get('/check-payment-status', [MpesaPaymentController::class, 'checkStatus']);
Route::post('/mpesa/callback', [MpesaPaymentController::class, 'callback']);
Route::get('/loan-types', [LoanTypeController::class, 'index']);
