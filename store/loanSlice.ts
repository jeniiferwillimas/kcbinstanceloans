import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { API_URLS } from './urljhelper';

export interface LoanType {
  id: number;
  name: string;
  description?: string;
  max_amount?: number;
}

export interface LoanState {
  loanTypes: LoanType[];
  selectedLoanAmount: number | null;
  phoneNumber: string;
  loanType: string;
  applicantName: string;
  nationalId: string;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: LoanState = {
  loanTypes: [],
  selectedLoanAmount: null,
  phoneNumber: '',
  loanType: '',
  applicantName: '',
  nationalId: '',
  status: 'idle',
  error: null,
};

export const fetchLoanTypes = createAsyncThunk('loan/fetchLoanTypes', async () => {
  const response = await fetch(API_URLS.loanTypes);
  if (!response.ok) {
    throw new Error('Failed to load loan types');
  }
  const result = (await response.json()) as { success: boolean; data: LoanType[] };
  return result.data;
});

const loanSlice = createSlice({
  name: 'loan',
  initialState,
  reducers: {
    setSelectedLoanAmount(state, action: PayloadAction<number | null>) {
      state.selectedLoanAmount = action.payload;
    },
    setPhoneNumber(state, action: PayloadAction<string>) {
      state.phoneNumber = action.payload;
    },
    setLoanType(state, action: PayloadAction<string>) {
      state.loanType = action.payload;
    },
    setApplicantName(state, action: PayloadAction<string>) {
      state.applicantName = action.payload;
    },
    setNationalId(state, action: PayloadAction<string>) {
      state.nationalId = action.payload;
    },
    resetLoanForm(state) {
      state.selectedLoanAmount = null;
      state.phoneNumber = '';
      state.loanType = '';
      state.applicantName = '';
      state.nationalId = '';
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLoanTypes.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchLoanTypes.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.loanTypes = action.payload;
      })
      .addCase(fetchLoanTypes.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Unable to fetch loan types';
      });
  },
});

export const {
  setSelectedLoanAmount,
  setPhoneNumber,
  setLoanType,
  setApplicantName,
  setNationalId,
  resetLoanForm,
} = loanSlice.actions;

export default loanSlice.reducer;
