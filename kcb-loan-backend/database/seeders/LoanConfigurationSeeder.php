<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\LoanConfiguration;

class LoanConfigurationSeeder extends Seeder
{
    public function run(): void
    {
        $configs = [
            [
                'key' => 'mpesa_till_number',
                'value' => '123456',
                'group' => 'mpesa',
                'description' => 'M-PESA Till Number for payments'
            ],
            [
                'key' => 'mpesa_consumer_key',
                'value' => env('MPESA_CONSUMER_KEY'),
                'group' => 'mpesa',
                'description' => 'M-PESA API Consumer Key',
                'is_encrypted' => true
            ],
            [
                'key' => 'mpesa_consumer_secret',
                'value' => env('MPESA_CONSUMER_SECRET'),
                'group' => 'mpesa',
                'description' => 'M-PESA API Consumer Secret',
                'is_encrypted' => true
            ],
            [
                'key' => 'mpesa_shortcode',
                'value' => '174379',
                'group' => 'mpesa',
                'description' => 'M-PESA Shortcode for STK Push'
            ],
            [
                'key' => 'default_interest_rate',
                'value' => '8.0',
                'group' => 'loan',
                'description' => 'Default interest rate for loans'
            ],
            [
                'key' => 'default_term_days',
                'value' => '180',
                'group' => 'loan',
                'description' => 'Default loan term in days (6 months)'
            ],
            [
                'key' => 'processing_fee_percentage',
                'value' => '4.59',
                'group' => 'loan',
                'description' => 'Processing fee percentage of loan amount'
            ],
        ];

        foreach ($configs as $config) {
            LoanConfiguration::create($config);
        }
    }
}