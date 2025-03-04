import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Button, 
  Box, 
  Typography, 
  Snackbar, 
  Alert,
  CircularProgress,
  ImageList,
  ImageListItem,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  NavigateNext,
  NavigateBefore,
  FirstPage,
  LastPage,
  Delete as DeleteIcon
} from '@mui/icons-material';
import axios from 'axios';
import ImageAnnotation from './ImageAnnotation';
import { useDispatch, useSelector } from 'react-redux';
import { fetchImages, uploadImages, deleteImage } from '../store/thunks/imageThunks';
import { setCurrentImageIndex } from '../store/slices/imageSlice';
import Navbar from './Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { images, currentImageIndex, loading } = useSelector((state) => state.images);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    dispatch(fetchImages());
  }, [dispatch]);

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const showNotification = (message, severity = 'success') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  const handleFileUpload = async (e) => {
    try {
      const files = e.target.files;
      if (files.length === 0) return;

      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) {
          showNotification(`${file.name} is not an image file`, 'error');
          continue;
        }
        formData.append('images', file);
      }

      await dispatch(uploadImages(formData));
      showNotification(`Successfully uploaded images`);
    } catch (error) {
      showNotification('Error uploading images', 'error');
    }
  };

  const handleSave = (updatedImage) => {
    try {
      const newImages = [...images];
      const index = newImages.findIndex(img => img._id === updatedImage._id);
      if (index !== -1) {
        newImages[index] = updatedImage;
        dispatch(fetchImages());
        showNotification('Image annotations updated successfully');
      }
    } catch (error) {
      showNotification('Error updating image annotations', 'error');
    }
  };

  const handleImageChange = (newIndex) => {
    try {
      dispatch(setCurrentImageIndex(newIndex));
      showNotification(`Viewing image ${newIndex + 1} of ${images.length}`, 'info');
    } catch (error) {
      showNotification('Error changing image', 'error');
    }
  };

  const handleKeyNavigation = (e) => {
    if (images.length === 0) return;

    switch (e.key) {
      case 'ArrowLeft':
        if (currentImageIndex > 0) {
          handleImageChange(currentImageIndex - 1);
        }
        break;
      case 'ArrowRight':
        if (currentImageIndex < images.length - 1) {
          handleImageChange(currentImageIndex + 1);
        }
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyNavigation);
    return () => window.removeEventListener('keydown', handleKeyNavigation);
  }, [currentImageIndex, images.length]);

  const handleDeleteImage = async (imageId) => {
    try {
      await dispatch(deleteImage(imageId));
      showNotification('Image deleted successfully');
      dispatch(fetchImages());
    } catch (error) {
      showNotification('Error deleting image', 'error');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Navbar />
      <Container maxWidth="xl">
        <motion.div
          initial={{ y: -50 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 100 }}
        >
          <Box sx={{ 
            my: 4, 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Box>
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                id="image-upload"
              />
              <label htmlFor="image-upload">
                <Button
                  variant="contained"
                  component="span"
                  disabled={!localStorage.getItem('token')}
                >
                  Upload Images
                </Button>
              </label>
            </Box>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.1 }}
            >
              <Button
                variant="contained"
                onClick={() => setShowThumbnails(!showThumbnails)}
                startIcon={showThumbnails ? <VisibilityOffIcon /> : <VisibilityIcon />}
                sx={{
                  background: 'linear-gradient(45deg, #1976d2, #2196f3)',
                  boxShadow: '0 4px 15px rgba(33, 150, 243, 0.3)',
                  borderRadius: '10px',
                  transition: 'all 0.1s ease',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1565c0, #1976d2)'
                  }
                }}
              >
                {showThumbnails ? 'Hide Thumbnails' : 'Show Thumbnails'}
              </Button>
            </motion.div>
          </Box>
        </motion.div>

        {loading && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          </motion.div>
        )}

        {!loading && images.length > 0 && (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentImageIndex}
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -300 }}
              transition={{ type: "spring", stiffness: 100 }}
            >
              <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">
                    Image {currentImageIndex + 1} of {images.length}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="First Image">
                      <IconButton 
                        onClick={() => handleImageChange(0)}
                        disabled={currentImageIndex === 0}
                      >
                        <FirstPage />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Previous Image">
                      <IconButton
                        onClick={() => handleImageChange(currentImageIndex - 1)}
                        disabled={currentImageIndex === 0}
                      >
                        <NavigateBefore />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Next Image">
                      <IconButton
                        onClick={() => handleImageChange(currentImageIndex + 1)}
                        disabled={currentImageIndex === images.length - 1}
                      >
                        <NavigateNext />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Last Image">
                      <IconButton
                        onClick={() => handleImageChange(images.length - 1)}
                        disabled={currentImageIndex === images.length - 1}
                      >
                        <LastPage />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Image">
                      <IconButton
                        onClick={() => handleDeleteImage(images[currentImageIndex]._id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </Paper>

              {showThumbnails && (
                <motion.div
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 100 }}
                >
                  <Paper elevation={3} sx={{ 
                    p: 2, 
                    mb: 2, 
                    maxHeight: '150px', 
                    overflow: 'auto',
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '15px',
                    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
                  }}>
                    <ImageList sx={{ m: 0 }} cols={10} rowHeight={100}>
                      {images.map((image, index) => (
                        <motion.div
                          whileHover={{ scale: 1.1, zIndex: 1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <ImageListItem 
                            key={image._id}
                            sx={{ 
                              cursor: 'pointer',
                              border: index === currentImageIndex ? '2px solid #1976d2' : 'none',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'translateY(-5px)',
                                boxShadow: '0 5px 15px rgba(0,0,0,0.3)'
                              }
                            }}
                            onClick={() => handleImageChange(index)}
                          >
                            <img
                              src={`http://localhost:5000${image.path}`}
                              alt={`Thumbnail ${index + 1}`}
                              loading="lazy"
                              style={{ 
                                height: '100px',
                                width: '100%',
                                objectFit: 'cover'
                              }}
                            />
                          </ImageListItem>
                        </motion.div>
                      ))}
                    </ImageList>
                  </Paper>
                </motion.div>
              )}
            </motion.div>

            <ImageAnnotation
              key={images[currentImageIndex]._id}
              image={images[currentImageIndex]}
              onSave={handleSave}
            />
          </AnimatePresence>
        )}

        <Snackbar
          open={notification.open}
          autoHideDuration={3000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert 
            onClose={handleCloseNotification} 
            severity={notification.severity}
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Container>
    </motion.div>
  );
};

export default Dashboard; 