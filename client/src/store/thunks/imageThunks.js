import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import {
  fetchImagesStart,
  fetchImagesSuccess,
  fetchImagesFailure,
  updateImageBoxes,
  addImages,
} from '../slices/imageSlice';

// Thunk to fetch images from the server
export const fetchImages = createAsyncThunk(
  'images/fetchImages',
  async (_, { dispatch }) => {
    try {
      dispatch(fetchImagesStart()); // Dispatch action to indicate loading state
      const response = await axios.get('http://localhost:5000/api/images', {
        headers: {
          'x-auth-token': localStorage.getItem('token'), // Include auth token
        },
      });
      dispatch(fetchImagesSuccess(response.data)); // Dispatch success action with fetched data
      return response.data;
    } catch (error) {
      dispatch(fetchImagesFailure(error.message)); // Dispatch failure action on error
      throw error;
    }
  }
);

// Thunk to save bounding boxes for a specific image
export const saveImageBoxes = createAsyncThunk(
  'images/saveBoxes',
  async ({ imageId, boxes }, { dispatch }) => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/images/${imageId}/boxes`,
        { boundingBoxes: boxes },
        {
          headers: {
            'x-auth-token': localStorage.getItem('token'), // Include auth token
          },
        }
      );
      dispatch(updateImageBoxes({ imageId, boxes })); // Update the Redux state with new boxes
      return response.data;
    } catch (error) {
      throw error; // Propagate error
    }
  }
);

// Thunk to upload images to the server
export const uploadImages = createAsyncThunk(
  'images/upload',
  async (formData, { dispatch }) => {
    try {
      const response = await axios.post(
        'http://localhost:5000/api/images/upload',
        formData,
        {
          headers: {
            'x-auth-token': localStorage.getItem('token'), // Include auth token
            'Content-Type': 'multipart/form-data', // Set content type for file upload
          },
        }
      );
      dispatch(addImages(response.data)); // Add uploaded images to Redux state
      return response.data;
    } catch (error) {
      throw error; // Propagate error
    }
  }
);

// Thunk to delete an image from the server
export const deleteImage = createAsyncThunk('images/deleteImage', async (imageId) => {
  const response = await axios.delete(`http://localhost:5000/api/images/${imageId}`);
  return response.data; // Assuming the response contains a success message
}); 