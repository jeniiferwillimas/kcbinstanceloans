'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Shield } from 'lucide-react'

interface LoaderProps {
  onComplete: () => void
}

export default function Loader({ onComplete }: LoaderProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 2
      })
    }, 50)

    // Complete after progress reaches 100%
    const timeout = setTimeout(() => {
      onComplete()
    }, 3000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [onComplete])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="relative w-20 h-20 mx-auto mb-8">
          <Image 
            src="/image.png" 
            alt="KCB Logo" 
            fill
            className="object-contain"
          />
        </div>

        {/* Loading Animation */}
        <div className="relative mb-8">
          <div className="w-24 h-24 mx-auto relative">
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
            {/* Animated ring */}
            <div 
              className="absolute inset-0 rounded-full border-4 border-[#1a3c6e] transition-all duration-300"
              style={{
                clipPath: `inset(0 ${100 - progress}% 0 0)`,
                transform: 'rotate(-90deg)'
              }}
            ></div>
            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 bg-[#1a3c6e] rounded-full flex items-center justify-center animate-pulse">
                <span className="text-white font-bold text-xl">K</span>
              </div>
            </div>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-semibold text-[#1a3c6e] mb-2">
          Preparing your application...
        </h2>

        {/* Secure Connection Badge */}
        <div className="flex items-center justify-center gap-2 text-green-600">
          <Shield className="w-4 h-4" />
          <span className="text-sm font-medium">Secure connection established</span>
        </div>

        {/* Progress Bar */}
        <div className="mt-6 w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
          <div 
            className="bg-[#1a3c6e] h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  )
}