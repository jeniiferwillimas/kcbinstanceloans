import { configureStore } from '@reduxjs/toolkit';
import loanReducer from './loanSlice';
import paymentReducer from './paymentSlice';

export const store = configureStore({
  reducer: {
    loan: loanReducer,
    payment: paymentReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
