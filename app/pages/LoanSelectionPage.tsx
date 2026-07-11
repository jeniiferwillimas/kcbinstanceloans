'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ArrowLeft, CheckCircle, Info, Loader2 } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchLoanTypes, setSelectedLoanAmount, setLoanType } from '@/store/loanSlice'

interface LoanSelectionPageProps {
  userName: string
  phoneNumber: string
  onBack: () => void
  onSelectLoan: (amount: number) => void
}

export default function LoanSelectionPage({ 
  userName, 
  phoneNumber,
  onBack, 
  onSelectLoan 
}: LoanSelectionPageProps) {
  const dispatch = useAppDispatch()
  const { loanTypes, status, error } = useAppSelector((state) => state.loan)
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [selectedLoanType, setSelectedLoanType] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  // Fetch loan types when component mounts
  useEffect(() => {
    const loadLoanTypes = async () => {
      try {
        await dispatch(fetchLoanTypes()).unwrap()
      } catch (err) {
        console.error('Failed to fetch loan types:', err)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadLoanTypes()
  }, [dispatch])

  // Generate loan options from API data
  const generateLoanOptions = () => {
    const options: Array<{
      amount: number
      label: string
      loanType: string
      description?: string
    }> = []

    loanTypes.forEach((loan) => {
      // Use max_amount if available, otherwise generate amounts based on loan type
      if (loan.max_amount) {
        options.push({
          amount: loan.max_amount,
          label: `KSh ${loan.max_amount.toLocaleString()}`,
          loanType: loan.name,
          description: loan.description
        })
      } else {
        // Generate dynamic amounts based on loan type name
        const baseAmount = getBaseAmountForLoanType(loan.name)
        const amounts = generateAmounts(baseAmount)
        
        amounts.forEach(amount => {
          options.push({
            amount: amount,
            label: `KSh ${amount.toLocaleString()}`,
            loanType: loan.name,
            description: loan.description
          })
        })
      }
    })

    return options
  }

  // Helper: Get base amount based on loan type
  const getBaseAmountForLoanType = (loanName: string): number => {
    const name = loanName.toLowerCase()
    if (name.includes('business') || name.includes('enterprise')) return 50000
    if (name.includes('education') || name.includes('school')) return 20000
    if (name.includes('emergency') || name.includes('urgent')) return 10000
    if (name.includes('home') || name.includes('mortgage')) return 100000
    if (name.includes('personal')) return 15000
    if (name.includes('auto') || name.includes('car')) return 30000
    if (name.includes('agriculture') || name.includes('farm')) return 25000
    return 20000 // Default
  }

  // Helper: Generate multiple amounts from base amount
  const generateAmounts = (baseAmount: number): number[] => {
    const multipliers = [0.25, 0.5, 0.75, 1, 1.5, 2, 3]
    const amounts = multipliers.map(m => Math.round(baseAmount * m / 1000) * 1000)
    // Remove duplicates and sort
    return [...new Set(amounts)].sort((a, b) => a - b)
  }

  // Fallback options if API fails
  const fallbackOptions: Array<{
    amount: number
    label: string
    loanType: string
    description?: string
  }> = [
    { amount: 5000, label: 'KSh 5,000', loanType: 'Personal' },
    { amount: 10000, label: 'KSh 10,000', loanType: 'Personal' },
    { amount: 20000, label: 'KSh 20,000', loanType: 'Personal' },
    { amount: 30000, label: 'KSh 30,000', loanType: 'Business' },
    { amount: 50000, label: 'KSh 50,000', loanType: 'Business' },
    { amount: 75000, label: 'KSh 75,000', loanType: 'Education' },
    { amount: 100000, label: 'KSh 100,000', loanType: 'Education' },
  ]

  const displayOptions = loanTypes.length > 0 ? generateLoanOptions() : fallbackOptions

  // Group options by loan type
  const groupedOptions = displayOptions.reduce((acc, option) => {
    if (!acc[option.loanType]) {
      acc[option.loanType] = []
    }
    acc[option.loanType].push(option)
    return acc
  }, {} as Record<string, typeof displayOptions>)

  const handleSelect = (amount: number, loanType: string) => {
    setSelectedAmount(amount)
    setSelectedLoanType(loanType)
    dispatch(setSelectedLoanAmount(amount))
    dispatch(setLoanType(loanType))
    
    // Navigate to confirmation after a brief delay
    setTimeout(() => {
      onSelectLoan(amount)
    }, 500)
  }

  // Show loading state
  if (isLoading || status === 'loading') {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="container-custom py-8">
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-[#1a3c6e] mx-auto" />
            <p className="mt-4 text-gray-600">Loading loan options...</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="container-custom py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="relative w-10 h-10">
                <Image 
                  src="/image.png" 
                  alt="KCB Logo" 
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-sm font-medium text-gray-700">KCB M-PESA Loans</span>
            </div>
          </div>
          <button className="text-gray-600 hover:text-gray-900 text-sm font-medium">
            Help
          </button>
        </div>
      </header>

      <div className="container-custom py-8">
        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1a3c6e] mb-2">
            You&apos;re approved!
          </h1>
          <p className="text-gray-600">
            Great news, <span className="font-semibold text-[#1a3c6e]">{userName}</span>! Pick the loan amount that works best for you.
          </p>
          {loanTypes.length > 0 && (
            <p className="text-sm text-gray-500 mt-2">
              {loanTypes.length} loan types available
            </p>
          )}
        </div>

        {/* Loan Options - Grouped by Type */}
        {Object.entries(groupedOptions).map(([loanType, options]) => (
          <div key={loanType} className="mb-8">
            <h2 className="text-lg font-semibold text-[#1a3c6e] mb-3 flex items-center gap-2">
              <span className="bg-[#1a3c6e] w-1 h-6 rounded-full"></span>
              {loanType} Loans
              {options[0]?.description && (
                <span className="text-sm font-normal text-gray-500">
                  - {options[0].description}
                </span>
              )}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {options.map((option) => (
                <div
                  key={`${option.loanType}-${option.amount}`}
                  className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer p-4 text-center border-2 ${
                    selectedAmount === option.amount && selectedLoanType === option.loanType
                      ? 'border-[#1a3c6e] ring-2 ring-[#1a3c6e]/20'
                      : 'border-transparent hover:border-gray-200'
                  }`}
                  onClick={() => handleSelect(option.amount, option.loanType)}
                >
                  <p className="text-lg font-bold text-[#1a3c6e]">{option.label}</p>
                  <p className="text-xs text-gray-500 mt-1">Repay over 6 months</p>
                  <button
                    className={`mt-3 w-full py-2 px-4 rounded-lg text-sm font-semibold transition-colors ${
                      selectedAmount === option.amount && selectedLoanType === option.loanType
                        ? 'bg-[#1a3c6e] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {selectedAmount === option.amount && selectedLoanType === option.loanType 
                      ? '✓ SELECTED' 
                      : 'SELECT'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Info Message */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">
            Tap an amount to see the full breakdown, including any processing fee.
          </p>
        </div>

        {/* Back Button */}
        <div className="text-center">
          <button
            onClick={onBack}
            className="text-[#1a3c6e] hover:text-[#2a4c7e] font-medium text-sm transition-colors"
          >
            ← Back to form
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#1a3c6e] text-white py-6 mt-8">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
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