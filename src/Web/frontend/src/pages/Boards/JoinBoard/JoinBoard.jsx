import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    CircularProgress,
    Alert
} from '@mui/material';
import { apiService } from '~/services/api';
import { useAuth } from '~/hooks/useAuth';
import { toast } from 'react-toastify';

export default function JoinBoard() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { isAuthenticated, isLoading } = useAuth();

    const token = searchParams.get('token');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleJoin = async () => {
        if (!token) {
            toast.error('Invalid join link');
            return;
        }

        setLoading(true);
        try {
            const response = await apiService.joinViaShareLink(token, message);

            setResult(response);

            if (response.success) {
                toast.success(response.message);

                // Redirect based on action
                if (response.action === 'auto_joined' || response.action === 'already_member') {
                    setTimeout(() => {
                        navigate(`/boards/${response.boardId}`);
                    }, 1500);
                }
            } else {
                toast.error(response.message);
            }
        } catch (err) {
            console.error('Join failed:', err);
            toast.error(err.message || 'Failed to join board');
            setResult({
                success: false,
                message: err.message || 'Invalid or expired link'
            });
        } finally {
            setLoading(false);
        }
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!isAuthenticated) {
        return null; // Will redirect
    }

    if (!token) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '100vh',
                    bgcolor: 'background.default'
                }}
            >
                <Alert severity="error">Invalid join link</Alert>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                bgcolor: 'background.default'
            }}
        >
            <Card sx={{ maxWidth: 500, width: '100%', mx: 2 }}>
                <CardContent>
                    <Typography variant="h5" gutterBottom align="center">
                        Join Board
                    </Typography>

                    {result ? (
                        <Box sx={{ mt: 2 }}>
                            <Alert
                                severity={result.success ? 'success' : 'error'}
                                sx={{ mb: 2 }}
                            >
                                {result.message}
                            </Alert>

                            {result.action === 'request_created' && (
                                <Typography variant="body2" color="text.secondary">
                                    Your request has been submitted. Board administrators will review it shortly.
                                </Typography>
                            )}

                            {(result.action === 'auto_joined' || result.action === 'already_member') && (
                                <Typography variant="body2" color="text.secondary">
                                    Redirecting to board...
                                </Typography>
                            )}

                            <Button
                                fullWidth
                                variant="outlined"
                                sx={{ mt: 2 }}
                                onClick={() => navigate('/')}
                            >
                                Go to Home
                            </Button>
                        </Box>
                    ) : (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                You're about to join a board. Add an optional message to introduce yourself:
                            </Typography>

                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Message (optional)"
                                placeholder="Hi, I'd like to join this board..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                sx={{ mb: 2 }}
                            />

                            <Button
                                fullWidth
                                variant="contained"
                                onClick={handleJoin}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <CircularProgress size={20} sx={{ mr: 1 }} />
                                        Processing...
                                    </>
                                ) : (
                                    'Join Board'
                                )}
                            </Button>
                        </Box>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
}