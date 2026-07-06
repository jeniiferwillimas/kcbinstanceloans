"use client"

import React, { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import PayWarningClient from './PayWarningClient'
import { getFeeAndRate } from '../../utils/loan'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchLoanTypes } from '@/store/loanSlice'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'

export default function Page() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { loanTypes, status } = useAppSelector((state) => state.loan)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [paymentCancelled, setPaymentCancelled] = useState(false)
  
  const amount = Number(searchParams.get('amount')) || 0
  const name = searchParams.get('name') || 'Customer'
  const phone = searchParams.get('phone') || ''
  const loanTypeParam = searchParams.get('loanType') || 'Personal'
  const nationalId = searchParams.get('nationalId') || ''
  
  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchLoanTypes())
    }
  }, [status, dispatch])

  const getMatchingLoanType = (param: string): string => {
    if (!loanTypes.length) return 'Personal Loan'
    
    const exactMatch = loanTypes.find(lt => 
      lt.name.toLowerCase() === param.toLowerCase()
    )
    if (exactMatch) return exactMatch.name
    
    const partialMatch = loanTypes.find(lt => 
      lt.name.toLowerCase().includes(param.toLowerCase()) ||
      param.toLowerCase().includes(lt.name.toLowerCase())
    )
    if (partialMatch) return partialMatch.name
    
    return loanTypes[0]?.name || 'Personal Loan'
  }

  const loanType = getMatchingLoanType(loanTypeParam)
  
  const { fee, rate } = getFeeAndRate(amount)
  const totalRepayment = amount + fee + Math.round(amount * rate)

  const handleCancel = () => {
    router.back()
  }

  const handlePaymentFailed = (error: string) => {
    setPaymentError(error)
    setPaymentSuccess(false)
    setPaymentCancelled(false)
  }

  const handlePaymentComplete = (data: Record<string, unknown>) => {
    setPaymentSuccess(true)
    setPaymentError(null)
    setPaymentCancelled(false)
    console.log('Payment completed with data:', data)
  }

  // ✅ FIX: Handle payment cancellation
  const handlePaymentCancelled = () => {
    setPaymentCancelled(true)
    setPaymentError(null)
    setPaymentSuccess(false)
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#007b3e] flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#007b3e] border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading loan types...</p>
        </div>
      </div>
    )
  }

  // ✅ FIX: Show cancellation state
  if (paymentCancelled) {
    return (
      <div className="min-h-screen bg-[#007b3e] flex items-center justify-center py-8 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-6 sm:p-8 text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-amber-600 mb-2">Payment Cancelled</h2>
            <p className="text-gray-600 mb-6">You cancelled the payment. You can try again if you wish.</p>
            <button
              onClick={() => {
                setPaymentCancelled(false)
                router.back()
              }}
              className="w-full bg-[#007b3e] hover:bg-[#006231] text-white font-bold py-3 px-6 rounded-2xl transition duration-200"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (paymentError) {
    return (
      <div className="min-h-screen bg-[#007b3e] flex items-center justify-center py-8 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-6 sm:p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">Payment Failed</h2>
            <p className="text-gray-600 mb-6">{paymentError}</p>
            <button
              onClick={() => {
                setPaymentError(null)
                router.back()
              }}
              className="w-full bg-[#007b3e] hover:bg-[#006231] text-white font-bold py-3 px-6 rounded-2xl transition duration-200"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-[#007b3e] flex items-center justify-center py-8 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-6 sm:p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-[#007b3e] mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-6">Your payment has been completed successfully.</p>
            <button
              onClick={() => {
                setPaymentSuccess(false)
                router.push('/')
              }}
              className="w-full bg-[#007b3e] hover:bg-[#006231] text-white font-bold py-3 px-6 rounded-2xl transition duration-200"
            >
              Continue to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <PayWarningClient
      userName={name}
      processingFee={fee}
      totalRepayment={totalRepayment}
      phoneNumber={phone}
      loanType={loanType}
      nationalId={nationalId}
      onCancel={handleCancel}
      onPaymentFailed={handlePaymentFailed}
      onPaymentComplete={handlePaymentComplete}
      onPaymentCancelled={handlePaymentCancelled}
    />
  )
}