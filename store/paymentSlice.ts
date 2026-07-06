import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { API_URLS } from './urljhelper';

export interface PaymentState {
  checkoutRequestId: string | null;
  merchantRequestId: string | null;
  loanId: number | null;
  paymentId: number | null;
  status: 'idle' | 'pending' | 'completed' | 'failed';
  error: string | null;
  response?: Record<string, unknown>;
  isPolling: boolean;
}

const initialState: PaymentState = {
  checkoutRequestId: null,
  merchantRequestId: null,
  loanId: null,
  paymentId: null,
  status: 'idle',
  error: null,
  response: undefined,
  isPolling: false,
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

    const result = await response.json();
    
    // ✅ FIX: If the response status is 'success', this is a successful STK push initiation
    // Don't throw an error, just return the data
    if (result.status === 'success') {
      return result;
    } else {
      throw new Error(result.message || 'Payment initiation failed');
    }
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
      state.paymentId = null;
      state.status = 'idle';
      state.error = null;
      state.response = undefined;
      state.isPolling = false;
    },
    setPollingStatus(state, action: { payload: boolean }) {
      state.isPolling = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initiateMpesaPayment.pending, (state) => {
        state.status = 'pending';
        state.error = null;
      })
      .addCase(initiateMpesaPayment.fulfilled, (state, action) => {
        // ✅ FIX: STK push was successfully sent - keep status as 'pending'
        state.status = 'pending';
        state.checkoutRequestId = action.payload.data?.checkout_request_id || null;
        state.merchantRequestId = action.payload.data?.merchant_request_id || null;
        state.loanId = action.payload.data?.loan_id || null;
        state.paymentId = action.payload.data?.payment_id || null;
        state.response = action.payload.data;
        state.error = null;
      })
      .addCase(initiateMpesaPayment.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Payment initiation failed';
      })
      .addCase(checkPaymentStatus.pending, (state) => {
        state.status = 'pending';
        state.error = null;
        state.isPolling = true;
      })
      .addCase(checkPaymentStatus.fulfilled, (state, action) => {
        const loanStatus = action.payload.data.status;
        // ✅ FIX: Check the loan status from the response
        if (loanStatus === 'approved') {
          state.status = 'completed';
        } else if (loanStatus === 'failed') {
          state.status = 'failed';
        } else {
          state.status = 'pending';
        }
        state.response = action.payload.data;
        state.isPolling = false;
      })
      .addCase(checkPaymentStatus.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Payment status check failed';
        state.isPolling = false;
      });
  },
});

export const { resetPaymentState, setPollingStatus } = paymentSlice.actions;
export default paymentSlice.reducer;