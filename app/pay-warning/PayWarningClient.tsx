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

  const onConfirm = async () => {
    try {
      await dispatch(initiateMpesaPayment({
        amount: processingFee,
        phone_number: phoneNumber,
        full_name: userName || 'Customer',
        national_id: nationalId,
        loan_amount: totalRepayment,
        loan_type: loanType,
      })).unwrap()

      if (onPaymentComplete) {
        onPaymentComplete()
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initiate M-PESA payment. Please try again.'
      console.error(err)
      
      if (onPaymentFailed) {
        onPaymentFailed(errorMessage)
      } else {
        alert(errorMessage)
      }
    }
  }

  return (
    <PayWarning
      userName={userName}
      processingFee={processingFee}
      totalRepayment={totalRepayment}
      phoneNumber={phoneNumber}
      loanType={loanType}
      nationalId={nationalId}
      onConfirm={onConfirm}
      onCancel={onCancel}
      onPaymentFailed={onPaymentFailed}
      onPaymentComplete={onPaymentComplete}
    />
  )
}