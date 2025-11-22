import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  IconButton,
  InputAdornment,
  alpha,
  useTheme
} from '@mui/material';
import { Visibility, VisibilityOff, Home } from '@mui/icons-material';
import { useAuth } from '~/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { keyframes } from '@mui/system';

// Animations
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const float = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
`;

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    userName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu không khớp');
      setLoading(false);
      return;
    }

    const { ...registerData } = formData;
    const result = await register(registerData);

    if (result.success) {
      navigate('/');
    } else {
      if (Array.isArray(result.error)) {
        const message = result.error.map(e => e.description).join('\n');
        setError(message);
      } else {
        setError(result.error?.message || 'Đăng ký thất bại');
      }
    }

    setLoading(false);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: isDark
          ? 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)'
          : 'linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #667eea 100%)',
        overflow: 'hidden',
      }}
    >
      {/* Animated background elements */}
      <Box
        sx={{
          position: 'absolute',
          top: '15%',
          left: '10%',
          width: '250px',
          height: '250px',
          borderRadius: '50%',
          background: alpha('#fff', 0.1),
          animation: `${float} 7s ease-in-out infinite`,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '10%',
          right: '8%',
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          background: alpha('#fff', 0.05),
          animation: `${float} 9s ease-in-out infinite`,
          animationDelay: '1.5s',
        }}
      />

      {/* Back to Home Button */}
      <IconButton
        onClick={() => navigate('/')}
        sx={{
          position: 'absolute',
          top: 20,
          left: 20,
          color: 'white',
          backgroundColor: alpha('#fff', 0.1),
          backdropFilter: 'blur(10px)',
          '&:hover': {
            backgroundColor: alpha('#fff', 0.2),
          },
        }}
      >
        <Home />
      </IconButton>

      <Card
        sx={{
          maxWidth: 450,
          width: '100%',
          mx: 2,
          background: isDark
            ? alpha('#1a1a1a', 0.8)
            : alpha('#fff', 0.95),
          backdropFilter: 'blur(20px)',
          borderRadius: 4,
          boxShadow: `0 20px 60px ${alpha('#000', 0.3)}`,
          border: `1px solid ${alpha('#fff', isDark ? 0.1 : 0.2)}`,
          animation: `${fadeInUp} 0.6s ease-out`,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            align="center"
            sx={{
              fontWeight: 700,
              mb: 1,
              background: isDark
                ? 'linear-gradient(90deg, #f093fb 0%, #f5576c 100%)'
                : 'linear-gradient(90deg, #f093fb 0%, #f5576c 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Đăng ký
          </Typography>

          <Typography
            variant="body2"
            align="center"
            color="text.secondary"
            sx={{ mb: 3 }}
          >
            Tạo tài khoản mới để bắt đầu quản lý dự án
          </Typography>

          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 2,
                whiteSpace: 'pre-line',
                borderRadius: 2,
                animation: `${fadeInUp} 0.3s ease-out`,
              }}
            >
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Tên người dùng"
              name="userName"
              value={formData.userName}
              onChange={handleChange}
              margin="normal"
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />

            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              margin="normal"
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />

            <TextField
              fullWidth
              label="Mật khẩu"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              margin="normal"
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword((prev) => !prev)}
                      edge="end"
                    >
                      {showPassword ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            <TextField
              fullWidth
              label="Xác nhận mật khẩu"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              margin="normal"
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      edge="end"
                    >
                      {showConfirmPassword ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                borderRadius: '50px',
                fontSize: '1rem',
                fontWeight: 600,
                background: 'linear-gradient(90deg, #f093fb 0%, #f5576c 100%)',
                boxShadow: '0 10px 30px rgba(240, 147, 251, 0.4)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 15px 40px rgba(240, 147, 251, 0.5)',
                },
                '&:disabled': {
                  background: 'linear-gradient(90deg, #f093fb 0%, #f5576c 100%)',
                  opacity: 0.6,
                },
              }}
            >
              {loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
            </Button>

            <Box textAlign="center">
              <Typography variant="body2" color="text.secondary">
                Đã có tài khoản?{' '}
                <Link
                  href="/login"
                  underline="hover"
                  sx={{
                    fontWeight: 600,
                    background: 'linear-gradient(90deg, #f093fb 0%, #f5576c 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Đăng nhập
                </Link>
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RegisterForm;