'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Shield, Lock, CheckCircle, Info } from 'lucide-react'

interface LoanConfirmationPageProps {
  userName: string
  loanAmount: number
  phoneNumber: string
  onBack: () => void
  onApply: () => void
}

export default function LoanConfirmationPage({ 
  userName, 
  loanAmount, 
  phoneNumber,
  onBack,
  onApply 
}: LoanConfirmationPageProps) {
  const [isApplying, setIsApplying] = useState(false)

  // Calculate fees
  const processingFee = 349
  const interestRate = 7.5
  const interestAmount = Math.round(loanAmount * (interestRate / 100))
  const totalRepayment = loanAmount + processingFee + interestAmount
  const formattedPhoneNumber = phoneNumber.replace(/\s/g, '')

  const handleApply = () => {
    setIsApplying(true)
    // Simulate API call
    setTimeout(() => {
      setIsApplying(false)
      onApply()
      // Show success message or redirect
      alert(`Loan of KSh ${loanAmount.toLocaleString()} approved! Funds will be sent to ${formattedPhoneNumber}`)
    }, 2000)
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="container-custom py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="relative w-10 h-10">
                <Image 
                  src="/image.png" 
                  alt="KCB Logo" 
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-sm font-medium text-gray-700">KCB M-PESA Loans</span>
            </div>
          </div>
          <button className="text-gray-600 hover:text-gray-900 text-sm font-medium">
            Help
          </button>
        </div>
      </header>

      <div className="container-custom py-8">
        {/* Back Link */}
        <button 
          onClick={onBack}
          className="text-[#1a3c6e] hover:text-[#2a4c7e] font-medium text-sm mb-6 flex items-center gap-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to offers
        </button>

        {/* Main Card */}
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-[#1a3c6e] text-white px-6 py-4">
            <h1 className="text-xl font-bold">Confirm Your Loan</h1>
          </div>

          <div className="p-6">
            {/* Greeting */}
            <p className="text-gray-600 mb-6">
              Hi <span className="font-semibold text-[#1a3c6e]">{userName}</span>, please review the details below before applying.
            </p>

            {/* Loan Amount Summary */}
            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">LOAN AMOUNT</p>
                  <p className="text-3xl font-bold text-[#1a3c6e]">
                    KSh {loanAmount.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Repayment Period</p>
                  <p className="font-semibold text-[#1a3c6e]">6 months</p>
                </div>
              </div>
            </div>

            {/* Fee Breakdown */}
            <div className="space-y-4 mb-6">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                Fee Breakdown
              </h3>
              
              <div className="border-t border-gray-200 pt-4 space-y-3">
                {/* Processing Fee */}
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-700">Processing Fee to Confirm Phone Number</p>
                    <p className="text-xs text-gray-500">One-time</p>
                  </div>
                  <p className="font-semibold text-[#1a3c6e]">KSh {processingFee}</p>
                </div>

                {/* Interest */}
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-700">Interest</p>
                    <p className="text-xs text-gray-500">{interestRate}%</p>
                  </div>
                  <p className="font-semibold text-[#1a3c6e]">KSh {interestAmount}</p>
                </div>

                {/* Repayment Period */}
                <div className="flex justify-between items-center">
                  <p className="font-medium text-gray-700">Repayment period</p>
                  <p className="font-semibold text-[#1a3c6e]">6 months</p>
                </div>
              </div>

              {/* Total */}
              <div className="border-t-2 border-[#1a3c6e] pt-4 mt-4">
                <div className="flex justify-between items-center">
                  <p className="text-lg font-bold text-[#1a3c6e]">Total repayment</p>
                  <p className="text-2xl font-bold text-[#e31e24]">KSh {totalRepayment.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Phone Number Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600">
                Funds will be sent to <span className="font-semibold text-[#1a3c6e]">+254{formattedPhoneNumber}</span>.
              </p>
            </div>

            {/* Terms & Apply Button */}
            <div className="space-y-4">
              <p className="text-xs text-gray-500 text-center">
                By tapping <span className="font-semibold">Apply Now</span> you agree to the loan terms. 
                The processing fee is deducted once on disbursement.
              </p>

              <button
                onClick={handleApply}
                disabled={isApplying}
                className="w-full bg-[#e31e24] hover:bg-[#c41a1f] text-white font-semibold py-4 px-8 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              >
                {isApplying ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'APPLY NOW'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-6 mt-8">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-gray-700">Secure</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-gray-700">Licensed</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-gray-700">No CRB Check</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#1a3c6e] text-white py-6 mt-8">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex gap-6">
              <a href="#" className="hover:text-gray-300 transition-colors text-sm">
                Privacy
              </a>
              <a href="#" className="hover:text-gray-300 transition-colors text-sm">
                Terms
              </a>
              <a href="#" className="hover:text-gray-300 transition-colors text-sm">
                Contact
              </a>
            </div>
            <p className="text-sm text-blue-300">
              &copy; 2026 KCB M-PESA Loans Kenya. Licensed by CBK.
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}