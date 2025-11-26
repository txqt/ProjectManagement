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
    IconButton,
    Link
} from '@mui/material';
import {
    Close as CloseIcon,
    Shield as ShieldIcon,
    VpnKey as KeyIcon
} from '@mui/icons-material';

function TwoFactorDialog({ open, onClose, onVerify, tempToken, loading, error }) {
    const [code, setCode] = useState('');
    const [useRecoveryCode, setUseRecoveryCode] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        const minLength = useRecoveryCode ? 8 : 6;
        if (code.length >= minLength) {
            onVerify(code);
        }
    };

    const handleCodeChange = (e) => {
        if (useRecoveryCode) {
            // Recovery code: alphanumeric, no length limit during typing
            const value = e.target.value.toUpperCase();
            setCode(value);
        } else {
            // TOTP code: 6 digits only
            const value = e.target.value.replace(/\D/g, '').slice(0, 6);
            setCode(value);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setCode('');
            setUseRecoveryCode(false);
            onClose();
        }
    };

    const toggleMode = () => {
        setCode('');
        setUseRecoveryCode(!useRecoveryCode);
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
                    {useRecoveryCode ? <KeyIcon color="primary" /> : <ShieldIcon color="primary" />}
                    <Typography variant="h6">
                        {useRecoveryCode ? 'Recovery Code' : 'Two-Factor Authentication'}
                    </Typography>
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
                        {useRecoveryCode
                            ? 'Enter one of your recovery codes to complete login.'
                            : 'Enter the 6-digit code from your authenticator app to complete login.'
                        }
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <TextField
                        autoFocus
                        label={useRecoveryCode ? "Recovery Code" : "Authentication Code"}
                        value={code}
                        onChange={handleCodeChange}
                        fullWidth
                        required
                        disabled={loading}
                        placeholder={useRecoveryCode ? "XXXXXXXX" : "000000"}
                        inputProps={
                            useRecoveryCode
                                ? {
                                    style: {
                                        fontSize: '1.2rem',
                                        letterSpacing: '0.2rem',
                                        textAlign: 'center',
                                        fontFamily: 'monospace'
                                    }
                                }
                                : {
                                    maxLength: 6,
                                    pattern: '[0-9]{6}',
                                    style: {
                                        fontSize: '1.5rem',
                                        letterSpacing: '0.5rem',
                                        textAlign: 'center'
                                    }
                                }
                        }
                        helperText={useRecoveryCode
                            ? "Enter the recovery code exactly as shown (case-insensitive)"
                            : "Enter the 6-digit code from your authenticator app"
                        }
                    />

                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                        <Link
                            component="button"
                            type="button"
                            variant="caption"
                            onClick={toggleMode}
                            disabled={loading}
                            sx={{ cursor: 'pointer' }}
                        >
                            {useRecoveryCode
                                ? '← Back to authenticator code'
                                : 'Lost your device? Use a recovery code →'
                            }
                        </Link>
                    </Box>
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
                        disabled={loading || (useRecoveryCode ? code.length < 8 : code.length !== 6)}
                        startIcon={loading ? <CircularProgress size={20} /> : (useRecoveryCode ? <KeyIcon /> : <ShieldIcon />)}
                    >
                        {loading ? 'Verifying...' : 'Verify'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}

export default TwoFactorDialog;
