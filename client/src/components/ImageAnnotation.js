import React, { useState, useRef, useEffect } from 'react';
import { Box, Button, Paper, List, ListItem, IconButton, Typography, Snackbar, Alert, Select, MenuItem, FormControl, InputLabel, Grid, Tooltip, Chip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { saveImageBoxes } from '../store/thunks/imageThunks';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import BorderStyleIcon from '@mui/icons-material/BorderStyle';
import LabelIcon from '@mui/icons-material/Label';
import { updateStyle } from '../store/slices/annotationStyleSlice';

const ImageAnnotation = ({ image, onSave }) => {
  const dispatch = useDispatch();
  const savedStyle = useSelector(state => state.annotationStyle.style);
  const [annotationStyle, setAnnotationStyle] = useState(savedStyle);
  const [boxes, setBoxes] = useState(image.boundingBoxes || []);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentBox, setCurrentBox] = useState(null);
  const [selectedBoxIndex, setSelectedBoxIndex] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const styleOptions = {
    colors: [
      { name: 'Red', value: '#FF0000' },
      { name: 'Blue', value: '#0000FF' },
      { name: 'Green', value: '#00FF00' },
      { name: 'Yellow', value: '#FFFF00' },
      { name: 'Purple', value: '#800080' }
    ],
    lineStyles: [
      { name: 'Solid', value: 'solid' },
      { name: 'Dashed', value: 'dashed' },
      { name: 'Dotted', value: 'dotted' }
    ],
    lineWidths: [1, 2, 3, 4, 5]
  };

  const canvasContainerVariants = {
    hidden: { opacity: 0, scale: 0.98 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    }
  };

  const listItemVariants = {
    hidden: { x: -10, opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: {
        duration: 0.1
      }
    }
  };

  useEffect(() => {
    setBoxes(image.boundingBoxes || []);
    setSelectedBoxIndex(null);
    setIsEditing(false);
    setIsDragging(false);
  }, [image]);

  useEffect(() => {
    drawCanvas();
  }, [boxes, selectedBoxIndex]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (img.complete) {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }

    boxes.forEach((box, index) => {
      ctx.strokeStyle = index === selectedBoxIndex ? '#FFD700' : annotationStyle.color;
      ctx.lineWidth = annotationStyle.lineWidth;
      
      if (annotationStyle.lineStyle === 'dashed') {
        ctx.setLineDash([5, 5]);
      } else if (annotationStyle.lineStyle === 'dotted') {
        ctx.setLineDash([2, 2]);
      } else {
        ctx.setLineDash([]);
      }

      ctx.strokeRect(box.x, box.y, box.width, box.height);
      
      if (index === selectedBoxIndex) {
        const handleSize = 6;
        ctx.fillStyle = '#FFD700';
        ctx.setLineDash([]);
        ctx.fillRect(box.x - handleSize/2, box.y - handleSize/2, handleSize, handleSize);
        ctx.fillRect(box.x + box.width - handleSize/2, box.y - handleSize/2, handleSize, handleSize);
        ctx.fillRect(box.x - handleSize/2, box.y + box.height - handleSize/2, handleSize, handleSize);
        ctx.fillRect(box.x + box.width - handleSize/2, box.y + box.height - handleSize/2, handleSize, handleSize);
      }
      
      ctx.fillStyle = index === selectedBoxIndex ? '#FFD700' : annotationStyle.color;
      ctx.font = '12px Arial';
      if (box.label && annotationStyle.labelStyle === 'custom') {
        ctx.fillText(box.label, box.x, box.y - 5);
      } else {
        ctx.fillText(`Box ${index + 1}`, box.x, box.y - 5);
      }
    });
  };

  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const isOverResizeHandle = (x, y, box) => {
    const handleSize = 6;
    const corners = [
      { x: box.x, y: box.y },
      { x: box.x + box.width, y: box.y },
      { x: box.x, y: box.y + box.height },
      { x: box.x + box.width, y: box.y + box.height }
    ];

    return corners.some(corner => 
      x >= corner.x - handleSize/2 &&
      x <= corner.x + handleSize/2 &&
      y >= corner.y - handleSize/2 &&
      y <= corner.y + handleSize/2
    );
  };

  const handleMouseDown = (e) => {
    const { x, y } = getMousePos(e);

    const clickedBoxIndex = boxes.findIndex(box => {
      const isInBox = x >= box.x && x <= box.x + box.width &&
                     y >= box.y && y <= box.y + box.height;
      const isOnHandle = isOverResizeHandle(x, y, box);
      return isInBox || isOnHandle;
    });

    if (clickedBoxIndex !== -1) {
      setSelectedBoxIndex(clickedBoxIndex);
      setIsDragging(true);
      setDragStart({ x, y });
      if (isOverResizeHandle(x, y, boxes[clickedBoxIndex])) {
        setIsEditing(true);
      }
      return;
    }

    if (!isEditing) {
      setIsDrawing(true);
      setCurrentBox({ x, y, width: 0, height: 0 });
      setSelectedBoxIndex(null);
    }
  };

  const handleMouseMove = (e) => {
    const { x, y } = getMousePos(e);

    if (isDrawing && currentBox) {
      setCurrentBox(prev => ({
        ...prev,
        width: x - prev.x,
        height: y - prev.y
      }));
      drawCanvas();
      
      const ctx = canvasRef.current.getContext('2d');
      ctx.strokeStyle = 'blue';
      ctx.lineWidth = 2;
      ctx.strokeRect(currentBox.x, currentBox.y, currentBox.width, currentBox.height);
    } else if (isDragging && selectedBoxIndex !== null) {
      const box = boxes[selectedBoxIndex];
      const dx = x - dragStart.x;
      const dy = y - dragStart.y;

      if (isEditing) {
        const newBoxes = [...boxes];
        newBoxes[selectedBoxIndex] = {
          ...box,
          width: box.width + dx,
          height: box.height + dy
        };
        setBoxes(newBoxes);
      } else {
        const newBoxes = [...boxes];
        newBoxes[selectedBoxIndex] = {
          ...box,
          x: box.x + dx,
          y: box.y + dy
        };
        setBoxes(newBoxes);
      }
      setDragStart({ x, y });
    }
  };

  const handleMouseUp = () => {
    if (currentBox && isDrawing) {
      const normalizedBox = {
        x: currentBox.width < 0 ? currentBox.x + currentBox.width : currentBox.x,
        y: currentBox.height < 0 ? currentBox.y + currentBox.height : currentBox.y,
        width: Math.abs(currentBox.width),
        height: Math.abs(currentBox.height)
      };
      setBoxes([...boxes, normalizedBox]);
      setSelectedBoxIndex(boxes.length);
    }
    setIsDrawing(false);
    setCurrentBox(null);
    setIsDragging(false);
    setIsEditing(false);
  };

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

  const handleDeleteBox = (indexToDelete) => {
    try {
      setBoxes(boxes.filter((_, index) => index !== indexToDelete));
      setSelectedBoxIndex(null);
      showNotification('Box deleted successfully');
    } catch (error) {
      showNotification('Error deleting box', 'error');
    }
  };

  const handleEditBox = (index) => {
    try {
      setSelectedBoxIndex(index);
      setIsEditing(true);
      showNotification('Box selected for editing');
    } catch (error) {
      showNotification('Error selecting box for edit', 'error');
    }
  };

  const handleSave = async () => {
    try {
      await dispatch(saveImageBoxes({ imageId: image._id, boxes }));
      showNotification('Annotations saved successfully');
    } catch (error) {
      showNotification('Error saving annotations', 'error');
    }
  };

  const handleStyleChange = (newStyle) => {
    setAnnotationStyle(newStyle);
    dispatch(updateStyle(newStyle));
  };

  const handleDownloadAnnotatedImage = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = 'annotated_image.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const StyleControls = () => (
    <Paper 
      elevation={2} 
      sx={{ 
        p: 2, 
        mb: 2, 
        background: 'rgba(255, 255, 255, 0.8)',
        borderRadius: '10px'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle2">
          Annotation Style
        </Typography>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.1 }}
        >
          <Button
            size="small"
            variant="outlined"
            onClick={() => handleStyleChange({
              color: '#FF0000',
              lineWidth: 2,
              lineStyle: 'solid',
              labelStyle: 'number'
            })}
          >
            Reset Style
          </Button>
        </motion.div>
      </Box>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <FormControl fullWidth size="small">
            <InputLabel>Color</InputLabel>
            <Select
              value={annotationStyle.color}
              onChange={(e) => handleStyleChange({ ...annotationStyle, color: e.target.value })}
              startAdornment={<ColorLensIcon sx={{ mr: 1 }} />}
            >
              {styleOptions.colors.map(color => (
                <MenuItem key={color.value} value={color.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box 
                      sx={{ 
                        width: 20, 
                        height: 20, 
                        backgroundColor: color.value,
                        borderRadius: '4px',
                        border: '1px solid rgba(0,0,0,0.1)'
                      }} 
                    />
                    {color.name}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={6}>
          <FormControl fullWidth size="small">
            <InputLabel>Line Style</InputLabel>
            <Select
              value={annotationStyle.lineStyle}
              onChange={(e) => handleStyleChange({ ...annotationStyle, lineStyle: e.target.value })}
              startAdornment={<BorderStyleIcon sx={{ mr: 1 }} />}
            >
              {styleOptions.lineStyles.map(style => (
                <MenuItem key={style.value} value={style.value}>
                  {style.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={6}>
          <FormControl fullWidth size="small">
            <InputLabel>Line Width</InputLabel>
            <Select
              value={annotationStyle.lineWidth}
              onChange={(e) => handleStyleChange({ ...annotationStyle, lineWidth: e.target.value })}
            >
              {styleOptions.lineWidths.map(width => (
                <MenuItem key={width} value={width}>
                  {width}px
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </Paper>
  );

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={canvasContainerVariants}
    >
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3,
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          gap: 3,
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(45deg, rgba(66, 165, 245, 0.05), rgba(21, 101, 192, 0.05))',
            zIndex: 0,
            borderRadius: '15px'
          }
        }}>
          <Box sx={{ flex: 1, position: 'relative' }}>
            <motion.div
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.1 }}
            >
              <img
                ref={imageRef}
                src={`http://localhost:5000${image.path}`}
                alt="Annotation"
                style={{ display: 'none' }}
                onLoad={() => {
                  if (canvasRef.current && imageRef.current) {
                    canvasRef.current.width = imageRef.current.naturalWidth;
                    canvasRef.current.height = imageRef.current.naturalHeight;
                  }
                  drawCanvas();
                }}
              />
              <canvas
                ref={canvasRef}
                style={{
                  border: '2px solid #1976d2',
                  borderRadius: '10px',
                  cursor: isEditing ? 'crosshair' : 'default',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  background: '#fff'
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
            </motion.div>
          </Box>

          <Box sx={{ width: '250px' }}>
            <StyleControls />
            <Typography variant="h6" sx={{ mb: 2, color: '#1976d2' }}>
              Bounding Boxes
            </Typography>
            <Paper 
              elevation={2}
              sx={{ 
                maxHeight: '400px', 
                overflow: 'auto',
                background: 'rgba(255, 255, 255, 0.8)',
                borderRadius: '10px'
              }}
            >
              <AnimatePresence initial={false}>
                <List>
                  {boxes.map((box, index) => (
                    <motion.div
                      key={index}
                      variants={listItemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      layout
                    >
                      <ListItem
                        sx={{
                          backgroundColor: index === selectedBoxIndex ? 'rgba(25, 118, 210, 0.1)' : 'transparent',
                          borderRadius: '8px',
                          mb: 1,
                          transition: 'all 0.1s ease',
                          '&:hover': {
                            backgroundColor: 'rgba(25, 118, 210, 0.05)',
                            transform: 'translateX(2px)'
                          }
                        }}
                      >
                        <Typography sx={{ flex: 1 }}>Box {index + 1}</Typography>
                        <motion.div 
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.1 }}
                        >
                          <IconButton 
                            onClick={() => handleEditBox(index)} 
                            size="small"
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                        </motion.div>
                        <motion.div 
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.1 }}
                        >
                          <IconButton 
                            onClick={() => handleDeleteBox(index)} 
                            size="small"
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </motion.div>
                      </ListItem>
                    </motion.div>
                  ))}
                </List>
              </AnimatePresence>
            </Paper>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.1 }}
            >
              <Button
                variant="contained"
                onClick={handleSave}
                sx={{ 
                  mt: 2,
                  width: '100%',
                  borderRadius: '10px',
                  background: 'linear-gradient(45deg, #1976d2, #2196f3)',
                  boxShadow: '0 4px 15px rgba(33, 150, 243, 0.3)',
                  transition: 'all 0.1s ease',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1565c0, #1976d2)'
                  }
                }}
              >
                Save Annotations
              </Button>
            </motion.div>

            {/* <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.1 }}
            >
              <Button
                variant="contained"
                onClick={handleDownloadAnnotatedImage}
                sx={{ 
                  mt: 2,
                  width: '100%',
                  borderRadius: '10px',
                  background: 'linear-gradient(45deg, #1976d2, #2196f3)',
                  boxShadow: '0 4px 15px rgba(33, 150, 243, 0.3)',
                  transition: 'all 0.1s ease',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1565c0, #1976d2)'
                  }
                }}
              >
                Download Annotated Image
              </Button>
            </motion.div> */}
          </Box>
        </Box>

        <Snackbar
          open={notification.open}
          autoHideDuration={3000}
          onClose={() => setNotification(prev => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert 
            onClose={() => setNotification(prev => ({ ...prev, open: false }))} 
            severity={notification.severity}
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Paper>
    </motion.div>
  );
};

export default ImageAnnotation; 