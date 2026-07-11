'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Shield, Lock, CheckCircle, Loader2 } from 'lucide-react'
import { useState } from 'react'

export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(false)

  const handleApplyClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Navigate after a delay to show the loading state
    setTimeout(() => {
      window.location.href = '/apply'
    }, 2000)
  }

  return (
    <main className="min-h-screen relative">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              {/* Spinner */}
              <div className="relative w-20 h-20 mb-6">
                <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-[#1a3c6e] rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Image
                    src="/image.png"
                    alt="KCB Logo"
                    width={32}
                    height={32}
                    className="object-contain"
                  />
                </div>
              </div>

              {/* Loading Message */}
              <h3 className="text-xl font-semibold text-[#1a3c6e] mb-2">
                Preparing your application...
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Secure connection established
              </p>

              {/* Animated dots */}
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-[#1a3c6e] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-[#1a3c6e] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                <div className="w-2 h-2 bg-[#1a3c6e] rounded-full animate-bounce" style={{ animationDelay: '600ms' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="container-custom py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="relative w-12 h-12">
              <Image
                src="/image.png"
                alt="KCB Logo"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-sm font-medium text-gray-700">M-PESA Loans</span>
          </div>
          <button className="text-gray-600 hover:text-gray-900 text-sm font-medium">
            Help
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container-custom py-12 md:py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-[#1a3c6e] mb-4">
              Get Up To <span className="text-[#e31e24]">Ksh 100,000</span>
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Low 5.5% interest rate for qualified borrowers
            </p>

            {/* Steps */}
            <div className="flex gap-6 mb-8 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#1a3c6e] text-white flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <span className="font-medium">Apply</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#1a3c6e] text-white flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <span className="font-medium">Approve</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#1a3c6e] text-white flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <span className="font-medium">Receive</span>
              </div>
            </div>

            <button
              onClick={handleApplyClick}
              disabled={isLoading}
              className="bg-[#e31e24] hover:bg-[#c41a1f] text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading...
                </>
              ) : (
                'Apply Now'
              )}
            </button>
          </div>

          {/* Right Content - Hero Image */}
          <div className="relative">
            <Image
              src="/image.png"
              alt="KCB M-PESA Loan Offer"
              width={500}
              height={400}
              className="rounded-2xl shadow-xl w-full h-auto"
              priority
            />
            {/* Overlay stats */}
            <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#1a3c6e]">Ksh 100K</p>
                  <p className="text-xs text-gray-600">Max Amount</p>
                </div>
                <div className="text-center border-l border-r border-gray-200">
                  <p className="text-2xl font-bold text-[#e31e24]">5.5%</p>
                  <p className="text-xs text-gray-600">Interest</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">3 Steps</p>
                  <p className="text-xs text-gray-600">Process</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-16">
        <div className="container-custom">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-[#1a3c6e]" />
              </div>
              <h3 className="text-xl font-semibold text-[#1a3c6e] mb-2 text-center">
                Quick Approval
              </h3>
              <p className="text-gray-600 text-center">
                Get pre-approved in minutes with our streamlined digital process.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-[#1a3c6e]" />
              </div>
              <h3 className="text-xl font-semibold text-[#1a3c6e] mb-2 text-center">
                Flexible Terms
              </h3>
              <p className="text-gray-600 text-center">
                Choose loan terms from 30 to 90 days that fit your budget.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-[#1a3c6e]" />
              </div>
              <h3 className="text-xl font-semibold text-[#1a3c6e] mb-2 text-center">
                No Hidden Fees
              </h3>
              <p className="text-gray-600 text-center">
                Transparent pricing with no surprises. Know exactly what you&apos;ll pay.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges Section */}
      <section className="container-custom py-12">
        <div className="flex flex-wrap justify-center gap-8 md:gap-12">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600" />
            <span className="font-medium text-gray-700">Secure</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="font-medium text-gray-700">Licensed</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-green-600" />
            <span className="font-medium text-gray-700">Encrypted</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      {/* Footer */}
      <footer className="bg-[#1a3c6e] text-white py-8 mt-8">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10">
                <Image
                  src="/image.png"
                  alt="KCB Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-sm">KCB M-PESA Loans</span>
            </div>
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