import React, { useState, useEffect } from 'react';
import { TextField, Button, Typography, Container, Box, Link, Snackbar, Alert } from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { loginStart, loginSuccess, loginFailure } from '../store/slices/authSlice';
import SpeedIcon from '@mui/icons-material/Speed';

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, loading, error } = useSelector(state => state.auth);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'error'
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (error) {
      showNotification(error, 'error');
    }
  }, [error]);

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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    if (formData.password.length < 6) {
      showNotification('Password must be at least 6 characters long', 'error');
      return false;
    }
    if (!formData.email.includes('@')) {
      showNotification('Please enter a valid email address', 'error');
      return false;
    }
    if (formData.username.length < 3) {
      showNotification('Username must be at least 3 characters long', 'error');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      dispatch(loginStart());
      const response = await axios.post('http://localhost:5000/api/auth/register', formData);
      dispatch(loginSuccess(response.data));
      showNotification('Registration successful!', 'success');
      navigate('/dashboard');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      dispatch(loginFailure(errorMessage));
      
      // Handle specific error cases
      if (error.response?.data?.field === 'username') {
        showNotification('Username is already taken', 'error');
      } else if (error.response?.data?.field === 'email') {
        showNotification('Email is already registered', 'error');
      } else {
        showNotification(errorMessage, 'error');
      }
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: 3,
          }}
        >
          <SpeedIcon sx={{ mr: 1, fontSize: 40, color: 'primary.main' }} />
          <Typography component="h1" variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            WhySoRush
          </Typography>
        </Box>
        <Typography component="h2" variant="h6" sx={{ mb: 3, color: 'text.secondary' }}>
          Create your account
        </Typography>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            mt: 1,
            backgroundColor: '#f5f5f5',
            p: 3,
            borderRadius: 2
          }}
        >
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Username"
            name="username"
            autoComplete="username"
            autoFocus
            value={formData.username}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="new-password"
            value={formData.password}
            onChange={handleChange}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register'}
          </Button>
          <Box sx={{ textAlign: 'center' }}>
            <Link component={RouterLink} to="/login" variant="body2">
              Already have an account? Sign In
            </Link>
          </Box>
        </Box>
      </Box>
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
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
  );
};

export default Register; 