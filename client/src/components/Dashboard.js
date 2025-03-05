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
  Delete as DeleteIcon,
  Download as DownloadIcon,
  PhotoCamera as AnnotatedDownloadIcon
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

  const handleDownloadImage = (path) => {
    const link = document.createElement('a');
    link.href = 'http://localhost:5000' + path;
    link.download = path.split('/').pop(); 
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAnnotatedImage = async (selectedImage) => {
    try {
      // 1. Fetch the image as a blob with CORS mode
      const response = await fetch(`http://localhost:5000${selectedImage.path}`, {
        mode: 'cors'
      });
      // 2. Turn it into a blob
      const blob = await response.blob();

      // 3. Create a blob URL for the image
      const objectURL = URL.createObjectURL(blob);

      // 4. Create a new Image object
      const tempImage = new Image();
      tempImage.crossOrigin = 'anonymous'; 
      tempImage.src = objectURL;

      tempImage.onload = () => {
        // 5. Draw onto an offscreen canvas (full image size)
        const canvas = document.createElement('canvas');
        canvas.width = tempImage.width;
        canvas.height = tempImage.height;
        const ctx = canvas.getContext('2d');

        // Draw the entire image
        ctx.drawImage(tempImage, 0, 0, canvas.width, canvas.height);

        // 6. Optionally draw bounding boxes on top
        (selectedImage.boundingBoxes || []).forEach((box) => {
          ctx.strokeStyle = '#FF0000';
          ctx.lineWidth = 2;
          ctx.setLineDash([]);
          ctx.strokeRect(box.x, box.y, box.width, box.height);

          ctx.fillStyle = '#FF0000';
          ctx.font = 'bold 14px Arial';
          ctx.fillText(box.label || 'Box', box.x, box.y - 5);
        });

        // 7. Download the full snapshot (image + boxes)
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `annotated_${selectedImage._id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // 8. Release the blob URL
        URL.revokeObjectURL(objectURL);
      };
    } catch (error) {
      showNotification('Error downloading annotated image', 'error');
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
                    <Tooltip title="Download Original Image">
                      <IconButton
                        onClick={() => handleDownloadImage(images[currentImageIndex].path)}
                        color="primary"
                      >
                        <DownloadIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Download Image with Annotations">
                      <IconButton
                        onClick={() => handleDownloadAnnotatedImage(images[currentImageIndex])}
                        color="primary"
                      >
                        <AnnotatedDownloadIcon />
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
                              crossOrigin="anonymous"
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