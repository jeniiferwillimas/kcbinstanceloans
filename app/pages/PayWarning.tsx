'use client'

import React, { useState, useEffect, useRef } from 'react'
import { AlertTriangle, Wallet, ArrowRight, ArrowLeft, CheckCircle, Clock, XCircle } from 'lucide-react'
import { formatForDisplay } from '../../utils/phone'
import { initiateMpesaPayment, resetPaymentState, checkPaymentStatus, incrementPollCount, resetPollCount } from '@/store/paymentSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'

interface PayWarningProps {
  userName?: string
  processingFee: number
  totalRepayment: number
  phoneNumber: string
  loanType: string
  nationalId: string
  onConfirm?: () => void
  onCancel?: () => void
  onPaymentComplete?: (data: Record<string, unknown>) => void
  onPaymentFailed?: (error: string) => void
  onPaymentCancelled?: () => void
}

interface PaymentStep {
  id: string
  label: string
  completed: boolean
  active: boolean
  failed: boolean
}

export default function PayWarning({ 
  userName, 
  processingFee, 
  totalRepayment, 
  phoneNumber, 
  loanType,
  nationalId,
  onConfirm, 
  onCancel,
  onPaymentComplete,
  onPaymentFailed,
  onPaymentCancelled
}: PayWarningProps) {
  const dispatch = useAppDispatch()
  const paymentState = useAppSelector((state) => state.payment)
  const [showPaymentProgress, setShowPaymentProgress] = useState(false)
  const [paymentSteps, setPaymentSteps] = useState<PaymentStep[]>([
    { id: 'sending', label: 'Sending STK push to your phone', completed: false, active: false, failed: false },
    { id: 'waiting', label: 'Waiting for you to enter M-PESA PIN', completed: false, active: false, failed: false },
    { id: 'confirming', label: 'Confirming payment', completed: false, active: false, failed: false },
  ])
  const [currentStep, setCurrentStep] = useState(0)
  const [paymentComplete, setPaymentComplete] = useState(false)
  const [paymentFailed, setPaymentFailed] = useState(false)
  const [paymentCancelled, setPaymentCancelled] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [loanId, setLoanId] = useState<number | null>(null)
  const pollingInterval = useRef<NodeJS.Timeout | null>(null)
  const maxPollAttempts = 60 // 5 minutes (60 * 5 seconds)
  const isPollingActive = useRef(false)

  const displayPhone = formatForDisplay(phoneNumber)

  // Reset payment state when component unmounts
  useEffect(() => {
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current)
        isPollingActive.current = false
      }
      dispatch(resetPaymentState())
    }
  }, [dispatch])

  // ✅ FIX: Start polling with proper limits
  useEffect(() => {
    if (loanId && !paymentComplete && !paymentFailed && !paymentCancelled && paymentState.status === 'pending') {
      // Don't start multiple polling intervals
      if (isPollingActive.current) return
      
      isPollingActive.current = true
      dispatch(resetPollCount())
      
      // Clear any existing interval
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current)
      }
      
      pollingInterval.current = setInterval(async () => {
        // Increment poll count in Redux
        dispatch(incrementPollCount())
        
        // Get current poll count from state
        const currentPollCount = paymentState.pollCount + 1
        
        try {
          const result = await dispatch(checkPaymentStatus({ loan_id: loanId })).unwrap()
          
          console.log('Status check result:', result.data.status)
          
          // ✅ FIX: Handle all statuses
          if (result.data?.status === 'approved') {
            if (pollingInterval.current) {
              clearInterval(pollingInterval.current)
              isPollingActive.current = false
            }
            setPaymentSteps(prev => 
              prev.map((step) => ({ ...step, completed: true, active: false }))
            )
            setPaymentComplete(true)
            setCurrentStep(3)
            if (onPaymentComplete) {
              onPaymentComplete(result.data as unknown as Record<string, unknown>)
            }
          } else if (result.data?.status === 'cancelled') {
            // ✅ FIX: Handle user cancellation
            if (pollingInterval.current) {
              clearInterval(pollingInterval.current)
              isPollingActive.current = false
            }
            setPaymentCancelled(true)
            setErrorMessage('Payment was cancelled by you')
            setPaymentSteps(prev => 
              prev.map((step, index) => 
                index === currentStep ? { ...step, failed: true, active: false } : step
              )
            )
            if (onPaymentCancelled) {
              onPaymentCancelled()
            }
            if (onPaymentFailed) {
              onPaymentFailed('Payment was cancelled by you')
            }
          } else if (result.data?.status === 'failed') {
            if (pollingInterval.current) {
              clearInterval(pollingInterval.current)
              isPollingActive.current = false
            }
            setPaymentFailed(true)
            setErrorMessage('Payment failed. Please try again.')
            setPaymentSteps(prev => 
              prev.map((step, index) => 
                index === currentStep ? { ...step, failed: true, active: false } : step
              )
            )
            if (onPaymentFailed) {
              onPaymentFailed('Payment failed. Please try again.')
            }
          }
          
          // Timeout after max attempts
          if (currentPollCount >= maxPollAttempts) {
            if (pollingInterval.current) {
              clearInterval(pollingInterval.current)
              isPollingActive.current = false
            }
            setPaymentFailed(true)
            setErrorMessage('Payment timed out. Please try again.')
            if (onPaymentFailed) {
              onPaymentFailed('Payment timed out. Please try again.')
            }
          }
        } catch (error) {
          console.error('Status check error:', error)
          // Don't fail on a single error, keep polling
        }
      }, 5000) // Poll every 5 seconds
    }

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current)
        isPollingActive.current = false
      }
    }
  }, [loanId, paymentComplete, paymentFailed, paymentCancelled, paymentState.status, dispatch, onPaymentComplete, onPaymentFailed, onPaymentCancelled, currentStep, maxPollAttempts])

  // Update steps based on payment state from Redux
  useEffect(() => {
    if (paymentState.status === 'pending' && paymentState.checkoutRequestId) {
      setShowPaymentProgress(true)
      
      if (paymentState.loanId) {
        setLoanId(paymentState.loanId)
      }
      
      // Step 1: STK sent
      setPaymentSteps(prev => 
        prev.map((step, index) => 
          index === 0 ? { ...step, completed: true, active: false } :
          index === 1 ? { ...step, active: true } :
          step
        )
      )
      setCurrentStep(1)
      
      // Step 2: After 5 seconds, move to "waiting for PIN"
      const timeout = setTimeout(() => {
        setPaymentSteps(prev => 
          prev.map((step, index) => 
            index === 1 ? { ...step, completed: true, active: false } :
            index === 2 ? { ...step, active: true } :
            step
          )
        )
        setCurrentStep(2)
      }, 5000)
      
      return () => clearTimeout(timeout)
    }
  }, [paymentState.status, paymentState.checkoutRequestId, paymentState.loanId])

  // Handle payment completion from Redux
  useEffect(() => {
    if (paymentState.status === 'completed' && !paymentComplete) {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current)
        isPollingActive.current = false
      }
      setPaymentSteps(prev => 
        prev.map((step) => ({ ...step, completed: true, active: false }))
      )
      setPaymentComplete(true)
      setCurrentStep(3)
      
      if (onPaymentComplete && paymentState.response) {
        onPaymentComplete(paymentState.response as Record<string, unknown>)
      }
    }
  }, [paymentState.status, paymentState.response, onPaymentComplete, paymentComplete])

  // Handle payment failure from Redux
  useEffect(() => {
    if (paymentState.status === 'failed' && !paymentFailed && !paymentCancelled) {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current)
        isPollingActive.current = false
      }
      setPaymentSteps(prev => 
        prev.map((step, index) => 
          index === currentStep ? { ...step, failed: true, active: false } : step
        )
      )
      setPaymentFailed(true)
      setErrorMessage(paymentState.error || 'Payment failed')
      
      if (onPaymentFailed) {
        onPaymentFailed(paymentState.error || 'Payment failed')
      }
    }
  }, [paymentState.status, paymentState.error, currentStep, onPaymentFailed, paymentFailed, paymentCancelled])

  // ✅ FIX: Handle cancellation from Redux
  useEffect(() => {
    if (paymentState.status === 'cancelled' && !paymentCancelled) {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current)
        isPollingActive.current = false
      }
      setPaymentSteps(prev => 
        prev.map((step, index) => 
          index === currentStep ? { ...step, failed: true, active: false } : step
        )
      )
      setPaymentCancelled(true)
      setErrorMessage('Payment was cancelled by you')
      
      if (onPaymentCancelled) {
        onPaymentCancelled()
      }
      if (onPaymentFailed) {
        onPaymentFailed('Payment was cancelled by you')
      }
    }
  }, [paymentState.status, currentStep, onPaymentFailed, onPaymentCancelled, paymentCancelled])

  const handleInitiatePayment = async () => {
    try {
      setShowPaymentProgress(true)
      
      setPaymentSteps(prev => 
        prev.map((step, index) => 
          index === 0 ? { ...step, active: true } : step
        )
      )
      setCurrentStep(0)
      
      const result = await dispatch(initiateMpesaPayment({
        amount: processingFee,
        phone_number: phoneNumber,
        full_name: userName || 'Customer',
        national_id: nationalId,
        loan_amount: totalRepayment,
        loan_type: loanType,
      })).unwrap()
      
      console.log('Payment initiated successfully:', result)
      
      if (result.data?.loan_id) {
        setLoanId(result.data.loan_id)
      }
      
      if (onConfirm) {
        onConfirm()
      }
    } catch (error) {
      console.error('Payment initiation error:', error)
      setPaymentFailed(true)
      setErrorMessage(error instanceof Error ? error.message : 'Failed to initiate payment')
      
      setPaymentSteps(prev => 
        prev.map((step, index) => 
          index === currentStep ? { ...step, failed: true, active: false } : step
        )
      )
      
      if (onPaymentFailed) {
        onPaymentFailed(error instanceof Error ? error.message : 'Failed to initiate payment')
      }
    }
  }

  const handleCancel = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current)
      isPollingActive.current = false
    }
    if (onCancel) {
      onCancel()
    }
  }

  const handleTryAgain = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current)
      isPollingActive.current = false
    }
    setShowPaymentProgress(false)
    setPaymentComplete(false)
    setPaymentFailed(false)
    setPaymentCancelled(false)
    setPaymentSteps([
      { id: 'sending', label: 'Sending STK push to your phone', completed: false, active: false, failed: false },
      { id: 'waiting', label: 'Waiting for you to enter M-PESA PIN', completed: false, active: false, failed: false },
      { id: 'confirming', label: 'Confirming payment', completed: false, active: false, failed: false },
    ])
    setCurrentStep(0)
    setLoanId(null)
    dispatch(resetPaymentState())
  }

  const handleGoBack = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current)
      isPollingActive.current = false
    }
    
    if (showPaymentProgress && !paymentComplete && !paymentFailed && !paymentCancelled) {
      setPaymentFailed(true)
      setErrorMessage('Request Cancelled by user.')
      
      setPaymentSteps(prev => 
        prev.map((step, index) => 
          index === currentStep ? { ...step, failed: true, active: false } : step
        )
      )
      
      if (onPaymentFailed) {
        onPaymentFailed('Request Cancelled by user.')
      }
    } else {
      handleCancel()
    }
  }

  // Render payment progress view
  if (showPaymentProgress) {
    return (
      <div className="min-h-screen bg-[#007b3e] flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center bg-[#3fb235] text-white px-2 py-0.5 rounded text-[11px] font-black tracking-tight select-none">
                <span className="text-[#e22127]">M</span>-PESA
              </div>
              <h1 className="text-2xl font-extrabold text-[#007b3e] tracking-tight">
                Payment Progress
              </h1>
            </div>

            <div className="bg-[#f4f9f4] rounded-2xl p-4 mb-6 text-center border border-[#e8f3e8]">
              <p className="text-xs text-[#718096] font-bold tracking-wider uppercase">
                Payment Amount
              </p>
              <p className="text-3xl font-black text-[#007b3e]">
                KSh {processingFee.toLocaleString()}
              </p>
            </div>

            <div className="space-y-4 mb-8">
              {paymentSteps.map((step) => (
                <div key={step.id} className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {step.completed ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : step.failed ? (
                      <XCircle className="w-5 h-5 text-red-500" />
                    ) : step.active ? (
                      <Clock className="w-5 h-5 text-[#007b3e] animate-pulse" />
                    ) : (
                      <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${
                      step.completed ? 'text-green-700' :
                      step.failed ? 'text-red-700' :
                      step.active ? 'text-[#007b3e]' :
                      'text-gray-400'
                    }`}>
                      {step.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {paymentFailed && (
              <div className="border border-red-200 bg-red-50 rounded-2xl p-4 mb-6">
                <p className="text-sm text-red-700 font-medium">
                  {errorMessage}
                </p>
              </div>
            )}

            {paymentCancelled && (
              <div className="border border-amber-200 bg-amber-50 rounded-2xl p-4 mb-6">
                <p className="text-sm text-amber-700 font-medium">
                  ⚠️ {errorMessage}
                </p>
              </div>
            )}

            {paymentComplete && (
              <div className="border border-green-200 bg-green-50 rounded-2xl p-4 mb-6">
                <p className="text-sm text-green-700 font-medium">
                  ✅ Payment completed successfully!
                </p>
              </div>
            )}

            <div className="flex flex-col gap-4">
              {(paymentFailed || paymentCancelled) ? (
                <button
                  onClick={handleTryAgain}
                  className="w-full bg-[#007b3e] hover:bg-[#006231] text-white font-bold py-4 px-6 rounded-2xl text-lg flex items-center justify-center gap-2 transition duration-200"
                >
                  Try Again
                  <ArrowRight className="w-5 h-5" />
                </button>
              ) : paymentComplete ? (
                <button
                  onClick={handleCancel}
                  className="w-full bg-[#007b3e] hover:bg-[#006231] text-white font-bold py-4 px-6 rounded-2xl text-lg flex items-center justify-center gap-2 transition duration-200"
                >
                  Continue
                  <ArrowRight className="w-5 h-5" />
                </button>
              ) : null}

              <button 
                onClick={handleGoBack}
                className="w-full text-center text-gray-500 hover:text-gray-800 text-sm font-semibold transition py-2 flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                {paymentFailed || paymentComplete || paymentCancelled ? 'Go back' : 'Cancel Payment'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render initial warning view
  return (
    <div className="min-h-screen bg-[#007b3e] flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/10">
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center bg-[#3fb235] text-white px-2 py-0.5 rounded text-[11px] font-black tracking-tight select-none">
              <span className="text-[#e22127]">M</span>-PESA
            </div>
            <h1 className="text-2xl font-extrabold text-[#007b3e] tracking-tight">
              Before You Pay
            </h1>
          </div>

          <p className="text-[#4b5563] text-base mb-6 font-medium">
            Hi {userName || 'Customer'}, please read this carefully before continuing.
          </p>

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

          <div className="border border-amber-200 bg-[#fffbeb] rounded-2xl p-5 mb-6 flex gap-3.5 items-start">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 leading-relaxed font-medium">
              Make sure your M-PESA account has at least <span className="font-extrabold text-amber-950">KSh {processingFee}</span> before continuing. If you do not have enough funds, top up now. Cancelling the payment prompt may look suspicious and can affect your loan application.
            </p>
          </div>

          <div className="bg-[#f4f9f4] rounded-2xl p-5 mb-8 flex gap-3.5 items-start border border-[#e8f3e8]">
            <div className="p-1 bg-white rounded-lg border border-[#e8f3e8] text-[#007b3e] flex-shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <p className="text-sm text-[#4b5563] leading-relaxed font-semibold">
              You will receive an M-PESA STK push on <span className="font-black text-gray-900">{displayPhone}</span>. Enter your PIN to complete the payment.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <button
              onClick={handleInitiatePayment}
              className="w-full bg-[#007b3e] hover:bg-[#006231] text-white font-bold py-4 px-6 rounded-2xl text-lg flex items-center justify-center gap-2 transition duration-200 shadow-lg shadow-[#007b3e]/20"
            >
              Continue to Payment
              <ArrowRight className="w-5 h-5" />
            </button>

            <button 
              onClick={handleCancel} 
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