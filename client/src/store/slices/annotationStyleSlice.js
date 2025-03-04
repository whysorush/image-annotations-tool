import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  style: {
    color: '#FF0000',
    lineWidth: 2,
    lineStyle: 'solid',
    labelStyle: 'number'
  }
};

// Load saved styles from localStorage if they exist
const savedStyles = localStorage.getItem('annotationStyles');
if (savedStyles) {
  initialState.style = JSON.parse(savedStyles);
}

const annotationStyleSlice = createSlice({
  name: 'annotationStyle',
  initialState,
  reducers: {
    updateStyle: (state, action) => {
      state.style = action.payload;
      // Save to localStorage
      localStorage.setItem('annotationStyles', JSON.stringify(action.payload));
    }
  }
});

export const { updateStyle } = annotationStyleSlice.actions;
export default annotationStyleSlice.reducer; 