<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('loan_applications', function (Blueprint $table) {
            $table->enum('status', [
                'pending',
                'approved',
                'processing_payment',
                'payment_pending',
                'disbursed',
                'completed',
                'rejected',
                'cancelled',
                'failed',
            ])->default('pending')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('loan_applications', function (Blueprint $table) {
            $table->enum('status', [
                'pending',
                'approved',
                'processing_payment',
                'payment_pending',
                'disbursed',
                'completed',
                'rejected',
                'cancelled',
            ])->default('pending')->change();
        });
    }
};
