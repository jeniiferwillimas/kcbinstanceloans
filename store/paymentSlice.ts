import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { API_URLS } from './urljhelper';

export interface PaymentState {
  checkoutRequestId: string | null;
  merchantRequestId: string | null;
  loanId: number | null;
  status: 'idle' | 'pending' | 'completed' | 'failed';
  error: string | null;
  response?: Record<string, unknown>;
}

const initialState: PaymentState = {
  checkoutRequestId: null,
  merchantRequestId: null,
  loanId: null,
  status: 'idle',
  error: null,
  response: undefined,
};

export const initiateMpesaPayment = createAsyncThunk(
  'payment/initiateMpesaPayment',
  async (payload: { 
    amount: number; 
    phone_number: string; 
    loan_type: string; 
    full_name: string; 
    national_id: string; 
    loan_amount: number;
    loan_application_id?: number 
  }) => {
    let response: Response;
    try {
      response = await fetch(API_URLS.initiatePayment, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new Error('Network error when contacting payment API: ' + msg);
    }

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(errorBody || `Failed to initiate payment (status ${response.status})`);
    }

    return (await response.json()) as {
      data: {
        loan_id: number;
        loan_type: string;
        payment_id: number;
        checkout_request_id: string;
        merchant_request_id: string;
        loan_amount: number;
        processing_fee: number;
        interest_rate: string;
        term_days: number;
        total_repayment: string;
        status: string;
        next_step: string;
      };
    };
  }
);

export const checkPaymentStatus = createAsyncThunk(
  'payment/checkPaymentStatus',
  async (payload: { loan_id: number }) => {
    const url = `${API_URLS.checkPaymentStatus}/${payload.loan_id}`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(errorBody || 'Failed to check payment status');
    }

    return (await response.json()) as {
      data: {
        id: number;
        full_name: string;
        loan_type: string;
        loan_amount: number;
        interest_rate: number;
        processing_fee: number;
        term_days: number;
        total_repayment: number;
        status: string;
        created_at: string;
        approved_at: string | null;
      };
    };
  }
);

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    resetPaymentState(state) {
      state.checkoutRequestId = null;
      state.merchantRequestId = null;
      state.loanId = null;
      state.status = 'idle';
      state.error = null;
      state.response = undefined;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initiateMpesaPayment.pending, (state) => {
        state.status = 'pending';
        state.error = null;
      })
      .addCase(initiateMpesaPayment.fulfilled, (state, action) => {
        state.status = 'pending';
        state.checkoutRequestId = action.payload.data.checkout_request_id;
        state.merchantRequestId = action.payload.data.merchant_request_id;
        state.loanId = action.payload.data.loan_id;
        state.response = action.payload.data;
      })
      .addCase(initiateMpesaPayment.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Payment initiation failed';
      })
      .addCase(checkPaymentStatus.pending, (state) => {
        state.status = 'pending';
        state.error = null;
      })
      .addCase(checkPaymentStatus.fulfilled, (state, action) => {
        const loanStatus = action.payload.data.status;
        if (loanStatus === 'approved') {
          state.status = 'completed';
        } else if (loanStatus === 'failed') {
          state.status = 'failed';
        } else {
          state.status = 'pending';
        }
        state.response = action.payload.data;
      })
      .addCase(checkPaymentStatus.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Payment status check failed';
      });
  },
});

export const { resetPaymentState } = paymentSlice.actions;
export default paymentSlice.reducer;