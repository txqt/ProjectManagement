import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Typography,
    Box,
    Alert,
    CircularProgress,
    IconButton
} from '@mui/material';
import {
    Close as CloseIcon,
    Shield as ShieldIcon
} from '@mui/icons-material';

function TwoFactorDialog({ open, onClose, onVerify, tempToken, loading, error }) {
    const [code, setCode] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (code.length === 6) {
            onVerify(code);
        }
    };

    const handleCodeChange = (e) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
        setCode(value);
    };

    const handleClose = () => {
        if (!loading) {
            setCode('');
            onClose();
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            disableEscapeKeyDown={loading}
        >
            <DialogTitle sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                pb: 1
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ShieldIcon color="primary" />
                    <Typography variant="h6">Two-Factor Authentication</Typography>
                </Box>
                <IconButton
                    onClick={handleClose}
                    disabled={loading}
                    size="small"
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <form onSubmit={handleSubmit}>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Enter the 6-digit code from your authenticator app to complete login.
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <TextField
                        autoFocus
                        label="Authentication Code"
                        value={code}
                        onChange={handleCodeChange}
                        fullWidth
                        required
                        disabled={loading}
                        placeholder="000000"
                        inputProps={{
                            maxLength: 6,
                            pattern: '[0-9]{6}',
                            style: {
                                fontSize: '1.5rem',
                                letterSpacing: '0.5rem',
                                textAlign: 'center'
                            }
                        }}
                        helperText="Enter the 6-digit code from your authenticator app"
                    />

                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                        Lost your device? You can use a recovery code instead.
                    </Typography>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={handleClose}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={loading || code.length !== 6}
                        startIcon={loading ? <CircularProgress size={20} /> : <ShieldIcon />}
                    >
                        {loading ? 'Verifying...' : 'Verify'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}

export default TwoFactorDialog;
