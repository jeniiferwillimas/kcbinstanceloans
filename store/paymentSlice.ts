import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { API_URLS } from './urljhelper';

export interface PaymentState {
  checkoutRequestId: string | null;
  merchantRequestId: string | null;
  status: 'idle' | 'pending' | 'completed' | 'failed';
  error: string | null;
  response?: Record<string, unknown>;
}

const initialState: PaymentState = {
  checkoutRequestId: null,
  merchantRequestId: null,
  status: 'idle',
  error: null,
  response: undefined,
};

export const initiateMpesaPayment = createAsyncThunk(
  'payment/initiateMpesaPayment',
  async (payload: { amount: number; phone_number: string; loan_type: string; full_name: string; national_id: string; loan_application_id?: number }) => {
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
        payment_id: number;
        checkout_request_id: string;
        merchant_request_id: string;
        status: string;
      };
    };
  }
);

export const checkPaymentStatus = createAsyncThunk(
  'payment/checkPaymentStatus',
  async (payload: { checkout_request_id: string }) => {
    const url = `${API_URLS.checkPaymentStatus}?checkout_request_id=${encodeURIComponent(payload.checkout_request_id)}`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(errorBody || 'Failed to check payment status');
    }

    return (await response.json()) as {
      data: {
        status: string;
        payment_id: number;
        mpesa_receipt: string | null;
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
        state.status = 'completed';
        state.checkoutRequestId = action.payload.data.checkout_request_id;
        state.merchantRequestId = action.payload.data.merchant_request_id;
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
        state.status = action.payload.data.status as PaymentState['status'];
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
