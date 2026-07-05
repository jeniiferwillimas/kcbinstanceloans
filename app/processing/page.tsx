'use client'

import React, { useEffect, useState } from 'react'
import ProcessingPage from '../pages/ProcessingPage'

export default function ProcessingRoutePage() {
  const [amount, setAmount] = useState(0)
  const [fee, setFee] = useState(0)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      setAmount(Number(params.get('amount') ?? '0'))
      setFee(Number(params.get('fee') ?? '0'))
      setName(params.get('name') ?? '')
      setPhone(params.get('phone') ?? '')
    } catch (e) {
      // ignore
    }
  }, [])

  return (
    <ProcessingPage
      mode="payment"
      amount={amount}
      fee={fee}
      phoneNumber={phone}
    />
  )
}
