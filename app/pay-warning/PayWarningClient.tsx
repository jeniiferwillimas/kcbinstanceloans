'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import PayWarning from '../pages/PayWarning'
import { useAppDispatch } from '@/store/hooks'
import { initiateMpesaPayment } from '@/store/paymentSlice'

interface PayWarningClientProps {
  userName: string
  processingFee: number
  totalRepayment: number
  phoneNumber: string
  loanType: string
  nationalId: string
  onCancel: () => void
  onPaymentFailed?: (error: string) => void
  onPaymentComplete?: () => void
}

export default function PayWarningClient({ 
  userName,
  processingFee,
  totalRepayment,
  phoneNumber,
  loanType,
  nationalId,
  onCancel,
  onPaymentFailed,
  onPaymentComplete
}: PayWarningClientProps) {
  const router = useRouter()
  const dispatch = useAppDispatch()

  // Removed the onConfirm function that was dispatching the payment
  // The PayWarning component will handle the dispatch internally

  return (
    <PayWarning
      userName={userName}
      processingFee={processingFee}
      totalRepayment={totalRepayment}
      phoneNumber={phoneNumber}
      loanType={loanType}
      nationalId={nationalId}
      onConfirm={() => {}} // No-op, the component handles it
      onCancel={onCancel}
      onPaymentFailed={onPaymentFailed}
      onPaymentComplete={onPaymentComplete}
    />
  )
}