export function normalizePhone(input: string): string {
  if (!input) return ''
  let s = input.trim()
  // Remove spaces, dashes, parentheses
  s = s.replace(/[()\s-]/g, '')
  // If it starts with +, keep the + for now, then strip other nondigits
  const hasPlus = s.startsWith('+')
  s = s.replace(/[^+0-9]/g, '')

  if (hasPlus && s.startsWith('+')) {
    // Remove any non-digit except leading +, then ensure country code present
    s = '+' + s.slice(1).replace(/[^0-9]/g, '')
  } else {
    // remove all nondigits
    s = s.replace(/[^0-9]/g, '')
  }

  // Now normalize to E.164 for Kenya (+254)
  if (s.startsWith('+')) {
    // Already has +, ensure it's +254...
    if (s.startsWith('+254')) return s
    // If another international code, just return as-is
    return s
  }

  if (s.startsWith('254')) return '+' + s
  if (s.startsWith('0')) return '+254' + s.slice(1)
  // if user entered without leading 0: 7XXXXXXXX or 1XXXXXXXX
  if (s.length === 9) return '+254' + s

  // fallback: if it's 6-13 digits, try to return with +254 prefix if plausible
  if (s.length >= 7 && s.length <= 12) {
    return '+254' + s.slice(-9)
  }

  // otherwise return original cleaned string
  return s
}

export function formatForDisplay(phone: string): string {
  const n = normalizePhone(phone)
  return n
}
