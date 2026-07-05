'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import PayWarning from '../pages/PayWarning'
import { buildEnvelope, postEnvelope } from '../../utils/event'
import { normalizePhone } from '../../utils/phone'
import { useAppDispatch } from '@/store/hooks'
import { initiateMpesaPayment } from '@/store/paymentSlice'

export default function PayWarningClient() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const [state, setState] = useState({
    amount: '0',
    fee: '0',
    name: '',
    phone: '',
    rate: '0.088',
    loanType: 'personal',
    nationalId: '',
  })

  const initializeState = useCallback(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      setState({
        amount: params.get('amount') ?? '0',
        fee: params.get('fee') ?? '0',
        name: params.get('name') ?? '',
        phone: params.get('phone') ?? '',
        rate: params.get('rate') ?? '0.088',
        loanType: params.get('loanType') ?? 'personal',
        nationalId: params.get('nationalId') ?? '',
      })
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    initializeState()
  }, [initializeState])

  const onConfirm = async () => {
    try {
      const normalized = normalizePhone(state.phone)
      const feeNum = Number(state.fee)
      const amountNum = Number(state.amount)
      
      const envelope = buildEnvelope('loan.application.requested', {
        loan_amount: amountNum,
        processing_fee: feeNum,
        applicant_name: state.name,
        phone_number: normalized,
        ui_ref: 'pay-warning'
      })

      // Send to event gateway
      try {
        await postEnvelope(envelope)
      } catch (e) {
        console.warn('Failed to post envelope to event gateway', e)
      }

      // Initiate actual Mpesa Payment (STK Push for processing fee)
      await dispatch(
        initiateMpesaPayment({
          amount: feeNum,
          phone_number: normalized,
          loan_type: state.loanType,
          full_name: state.name,
          national_id: state.nationalId || '12345678',
        })
      ).unwrap()

      const params = new URLSearchParams({
        amount: state.amount,
        fee: state.fee,
        name: state.name,
        phone: normalized,
      })
      router.push(`/processing?${params.toString()}`)
    } catch (err: unknown) {
      console.error(err)
      alert(
        err instanceof Error
          ? err.message
          : 'Failed to initiate M-PESA payment. Please try again.'
      )
    }
  }

  const onCancel = () => router.back()

  const amountValue = Number(state.amount)
  const feeValue = Number(state.fee)
  const rateValue = Number(state.rate)
  const totalRepayment = amountValue + feeValue + Math.round(amountValue * rateValue)

  return (
    <PayWarning
      userName={state.name}
      processingFee={feeValue}
      totalRepayment={totalRepayment}
      phoneNumber={state.phone}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  )
}
