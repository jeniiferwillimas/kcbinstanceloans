<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\LoanTypeController;
use App\Http\Controllers\Api\LoanApplicationController;

Route::post('/apply-loan', [LoanApplicationController::class, 'store']);
Route::get('/loan-types', [LoanTypeController::class, 'index']);
