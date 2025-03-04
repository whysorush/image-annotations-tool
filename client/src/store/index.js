import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import imageReducer from './slices/imageSlice';
import annotationStyleReducer from './slices/annotationStyleSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    images: imageReducer,
    annotationStyle: annotationStyleReducer
  },
}); 