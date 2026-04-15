import { configureStore } from '@reduxjs/toolkit';
import screeningReducer from './slices/screeningSlice';
import candidatesReducer from './slices/candidatesSlice';
import jobsReducer from './slices/jobsSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    screening:  screeningReducer,
    candidates: candidatesReducer,
    jobs:       jobsReducer,
    ui:         uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export type RootState   = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
