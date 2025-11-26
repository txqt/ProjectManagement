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
import { Visibility, VisibilityOff, ArrowBack, Home } from '@mui/icons-material';
import { useAuth } from '~/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { keyframes } from '@mui/system';
import TwoFactorDialog from '~/components/TwoFactorDialog';
import { apiService } from '~/services/api';

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

const LoginForm = () => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [show2FADialog, setShow2FADialog] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [twoFactorError, setTwoFactorError] = useState('');
  const [verifying2FA, setVerifying2FA] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const searchParams = new URLSearchParams(location.search);
  const returnUrl = searchParams.get('returnUrl') || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await apiService.login(credentials);

      // CHECK IF 2FA IS REQUIRED
      if (result.requiresTwoFactor) {
        setTempToken(result.tempToken);
        setShow2FADialog(true);
        setLoading(false);
        return;
      }

      // Normal login success
      if (result.token && result.user) {
        localStorage.setItem('authToken', result.token);
        localStorage.setItem('userData', JSON.stringify(result.user));
        apiService.setAuthToken(result.token);
        console.log('Redirecting to:', returnUrl);
        navigate(returnUrl);
        window.location.reload();
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    }
    setLoading(false);
  };

  const handle2FAVerify = async (code) => {
    setVerifying2FA(true);
    setTwoFactorError('');
    try {
      const result = await apiService.verify2FALogin({
        tempToken: tempToken,
        code: code
      });
      if (result.token && result.user) {
        // Login successful - save both token and user data
        localStorage.setItem('authToken', result.token);
        localStorage.setItem('userData', JSON.stringify(result.user));
        apiService.setAuthToken(result.token);
        setShow2FADialog(false);
        navigate(returnUrl);
        window.location.reload(); // Reload to update AuthProvider
      } else {
        setTwoFactorError('Invalid 2FA code');
      }
    } catch (err) {
      setTwoFactorError(err.message || 'Invalid 2FA code');
    }
    setVerifying2FA(false);
  };

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
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
          ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        overflow: 'hidden',
      }}
    >
      {/* Animated background elements */}
      <Box
        sx={{
          position: 'absolute',
          top: '10%',
          right: '10%',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: alpha('#fff', 0.1),
          animation: `${float} 6s ease-in-out infinite`,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '15%',
          left: '5%',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: alpha('#fff', 0.05),
          animation: `${float} 8s ease-in-out infinite`,
          animationDelay: '1s',
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
                ? 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
                : 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Đăng nhập
          </Typography>

          <Typography
            variant="body2"
            align="center"
            color="text.secondary"
            sx={{ mb: 3 }}
          >
            Chào mừng trở lại! Vui lòng đăng nhập để tiếp tục
          </Typography>

          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 2,
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
              label="Email"
              name="email"
              type="email"
              value={credentials.email}
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
              value={credentials.password}
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
                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 10px 30px rgba(102, 126, 234, 0.4)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 15px 40px rgba(102, 126, 234, 0.5)',
                },
                '&:disabled': {
                  background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                  opacity: 0.6,
                },
              }}
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>

            <Box textAlign="center">
              <Typography variant="body2" color="text.secondary">
                Chưa có tài khoản?{' '}
                <Link
                  href="/register"
                  underline="hover"
                  sx={{
                    fontWeight: 600,
                    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Đăng ký ngay
                </Link>
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
      <TwoFactorDialog
        open={show2FADialog}
        onClose={() => setShow2FADialog(false)}
        onVerify={handle2FAVerify}
        tempToken={tempToken}
        loading={verifying2FA}
        error={twoFactorError}
      />
    </Box>
  );
};

export default LoginForm;