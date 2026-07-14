export interface LoanDetails {
  fee: number;
  rate: number;
  termDays: number;
}

export function getFeeAndRate(amount: number): LoanDetails {
  switch (amount) {
    case 4000:
      return { fee: 199, rate: 0.088, termDays: 180 };
    case 5000:
      return { fee: 199, rate: 0.088, termDays: 180 };
    case 10000:
      return { fee: 349, rate: 0.088, termDays: 180 };
    case 15000:
      return { fee: 449, rate: 0.088, termDays: 180 };
    case 20000:
      return { fee: 549, rate: 0.088, termDays: 180 };
    case 25000:
      return { fee: 649, rate: 0.088, termDays: 180 };
    case 30000:
      return { fee: 799, rate: 0.088, termDays: 180 }; // matches screenshot
    case 40000:
      return { fee: 999, rate: 0.088, termDays: 180 };
    case 50000:
      return { fee: 1299, rate: 0.088, termDays: 180 };
    case 75000:
      return { fee: 1799, rate: 0.088, termDays: 180 };
    case 100000:
      return { fee: 2499, rate: 0.088, termDays: 180 };
    default:
      return { fee: Math.round(amount * 0.0266), rate: 0.088, termDays: 180 };
  }
}
