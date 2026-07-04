<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\LoanTypeController;


Route::get('/loan-types', [LoanTypeController::class, 'index']);
