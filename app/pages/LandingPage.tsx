'use client'
import { Shield, Clock, CreditCard, Lock, CheckCircle } from 'lucide-react'

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="container-custom py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-[#1a3c6e] text-white font-bold text-xl px-3 py-1 rounded">
              KCB
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
            <div className="flex gap-6 mb-8">
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

            <button className="bg-[#e31e24] hover:bg-[#c41a1f] text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200">
              Apply Now
            </button>
          </div>

          {/* Right Content - Stats/Features */}
          <div className="bg-gradient-to-br from-[#1a3c6e] to-[#2a4c7e] text-white p-8 rounded-2xl shadow-xl">
            <div className="space-y-6">
              <div>
                <h3 className="text-4xl font-bold mb-2">Ksh 100,000</h3>
                <p className="text-blue-200">Maximum loan amount</p>
              </div>
              <div className="border-t border-blue-400/30 pt-4">
                <p className="text-2xl font-bold text-[#ffd700]">5.5%</p>
                <p className="text-blue-200">Interest rate for qualified borrowers</p>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-blue-400/30">
                <div className="text-center">
                  <div className="text-2xl font-bold">1</div>
                  <div className="text-xs text-blue-200">Apply</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">2</div>
                  <div className="text-xs text-blue-200">Approve</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">3</div>
                  <div className="text-xs text-blue-200">Receive</div>
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
            {/* Feature 1 */}
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-[#1a3c6e]" />
              </div>
              <h3 className="text-xl font-semibold text-[#1a3c6e] mb-2">
                Quick Approval
              </h3>
              <p className="text-gray-600">
                Get pre-approved in minutes with our streamlined digital process.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <CreditCard className="w-6 h-6 text-[#1a3c6e]" />
              </div>
              <h3 className="text-xl font-semibold text-[#1a3c6e] mb-2">
                Flexible Terms
              </h3>
              <p className="text-gray-600">
                Choose loan terms from 30 to 90 days that fit your budget.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-[#1a3c6e]" />
              </div>
              <h3 className="text-xl font-semibold text-[#1a3c6e] mb-2">
                No Hidden Fees
              </h3>
              <p className="text-gray-600">
                Transparent pricing with no surprises. Know exactly what you'll pay.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges Section */}
      <section className="container-custom py-12">
        <div className="flex flex-wrap justify-center gap-8 md:gap-12">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-green-600" />
            <span className="font-medium text-gray-700">Secure</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="font-medium text-gray-700">Licensed</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600" />
            <span className="font-medium text-gray-700">Encrypted</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1a3c6e] text-white py-8 mt-8">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex gap-6">
              <a href="#" className="hover:text-gray-300 transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-gray-300 transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-gray-300 transition-colors">
                Contact
              </a>
            </div>
            <p className="text-sm text-blue-300">
              © 2026 KCB M-PESA Loans Kenya. Licensed by CBK.
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}