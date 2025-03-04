import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  images: [],
  currentImageIndex: 0,
  loading: false,
  error: null,
};

const imageSlice = createSlice({
  name: 'images',
  initialState,
  reducers: {
    fetchImagesStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchImagesSuccess: (state, action) => {
      state.loading = false;
      state.images = action.payload;
    },
    fetchImagesFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    setCurrentImageIndex: (state, action) => {
      state.currentImageIndex = action.payload;
    },
    updateImageBoxes: (state, action) => {
      const { imageId, boxes } = action.payload;
      const imageIndex = state.images.findIndex(img => img._id === imageId);
      if (imageIndex !== -1) {
        state.images[imageIndex].boundingBoxes = boxes;
      }
    },
    addImages: (state, action) => {
      state.images.push(...action.payload);
    },
  },
});

export const {
  fetchImagesStart,
  fetchImagesSuccess,
  fetchImagesFailure,
  setCurrentImageIndex,
  updateImageBoxes,
  addImages,
} = imageSlice.actions;

export default imageSlice.reducer; 