import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '~/contexts/AuthProvider';
import { useAuth } from '~/hooks/useAuth';
import Board from './pages/Boards/_id';
import LoginForm from '~/components/Auth/LoginForm';
import RegisterForm from '~/components/Auth/RegisterForm';
import { Box, CircularProgress } from '@mui/material';
import MyBoardInvite from './pages/Boards/MyBoardInvite/MyBoardInvite';
import AppBar from './components/AppBar/AppBar';
import AccountProfile from './pages/Users/AccountProfile';

// Import component HomePage mới
import HomePage from './pages/HomePage.jsx';
import LandingPage from './pages/LandingPage/LandingPage.jsx';
import JoinBoard from './pages/Boards/JoinBoard/JoinBoard.jsx';
import { useLocation } from 'react-router-dom';

// Import Docs pages
import Docs from './pages/Docs/Docs.jsx';
import DocsWelcome from './pages/Docs/DocsWelcome.jsx';
import Installation from './pages/Docs/Installation.jsx';
import GettingStarted from './pages/Docs/GettingStarted.jsx';
import RunningApp from './pages/Docs/RunningApp.jsx';
import DeveloperGuide from './pages/Docs/DeveloperGuide.jsx';
import Contribute from './pages/Docs/Contribute.jsx';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    // ⚡️ Gửi kèm returnUrl trong query string
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?returnUrl=${returnUrl}`} replace />;
  }

  return children;
};

// Public Route component (redirect to home if already authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const hasReturnUrl = location.search.includes('returnUrl=');

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (isAuthenticated && !hasReturnUrl) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Root Route component (Landing page for guests, HomePage for authenticated users)
const RootRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return isAuthenticated ? <HomePage /> : <LandingPage />;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginForm />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterForm />
          </PublicRoute>
        }
      />

      {/* Root route - Landing page for guests, HomePage for authenticated users */}
      <Route
        path="/"
        element={<RootRoute />}
      />

      {/* Documentation routes - Public */}
      <Route path="/docs" element={<Docs />}>
        <Route index element={<DocsWelcome />} />
        <Route path="installation" element={<Installation />} />
        <Route path="getting-started" element={<GettingStarted />} />
        <Route path="running-app" element={<RunningApp />} />
        <Route path="developer-guide" element={<DeveloperGuide />} />
        <Route path="contribute" element={<Contribute />} />
      </Route>

      {/* Protected routes */}
      <Route
        path="/account"
        element={
          <ProtectedRoute>
            <AccountProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/boards/:boardId"
        element={
          <ProtectedRoute>
            <Board />
          </ProtectedRoute>
        }
      />
      <Route
        path="/boards/invites"
        element={
          <ProtectedRoute>
            <AppBar />
            <MyBoardInvite />
          </ProtectedRoute>
        }
      />
      <Route
        path="/join"
        element={
          <ProtectedRoute>
            <JoinBoard />
          </ProtectedRoute>}
      />
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}