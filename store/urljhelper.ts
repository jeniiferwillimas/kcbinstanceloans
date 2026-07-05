export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api';

export const API_URLS = {
  loanTypes: `${API_BASE_URL}/loan-types`,
  initiatePayment: `${API_BASE_URL}/initiate-payment`,
  checkPaymentStatus: `${API_BASE_URL}/check-payment-status`,
  mpesaCallback: `${API_BASE_URL}/mpesa/callback`,
};
