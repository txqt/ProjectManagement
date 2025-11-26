import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Card,
    CardContent,
    Avatar,
    Typography,
    TextField,
    Button,
    Tabs,
    Tab,
    Alert,
    Snackbar,
    CircularProgress,
    Chip,
    Divider,
    Stack
} from '@mui/material';
import {
    Person as PersonIcon,
    Edit as EditIcon,
    Lock as LockIcon,
    Save as SaveIcon,
    Security as SecurityIcon,
    Shield as ShieldIcon,
    QrCode2 as QrCodeIcon,
    ContentCopy as CopyIcon
} from '@mui/icons-material';
import { useAuth } from '~/hooks/useAuth';
import { apiService } from '~/services/api';
import AppBar from '~/components/AppBar/AppBar';

function TabPanel({ children, value, index }) {
    return (
        <div hidden={value !== index} role="tabpanel">
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    );
}

function AccountProfile() {
    const { user: authUser, updateUser } = useAuth();
    const [tabValue, setTabValue] = useState(0);
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Edit profile form state
    const [editForm, setEditForm] = useState({
        userName: '',
        email: '',
        avatar: ''
    });

    // Change password form state
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // 2FA state
    const [twoFactorStatus, setTwoFactorStatus] = useState({
        isTwoFactorEnabled: false,
        recoveryCodesLeft: 0
    });
    const [twoFactorSetup, setTwoFactorSetup] = useState({
        sharedKey: '',
        authenticatorUri: '',
        qrCodeUrl: ''
    });
    const [verificationCode, setVerificationCode] = useState('');
    const [recoveryCodes, setRecoveryCodes] = useState([]);
    const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);

    // Load profile on mount
    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const data = await apiService.getProfile();
            setProfile(data);
            setEditForm({
                userName: data.userName || '',
                email: data.email || '',
                avatar: data.avatar || ''
            });

            // Load 2FA status
            await load2FAStatus();
        } catch (error) {
            showSnackbar(error.message || 'Failed to load profile', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleEditFormChange = (e) => {
        setEditForm({
            ...editForm,
            [e.target.name]: e.target.value
        });
    };

    const handlePasswordFormChange = (e) => {
        setPasswordForm({
            ...passwordForm,
            [e.target.name]: e.target.value
        });
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const updatedUser = await apiService.updateProfile(editForm);
            setProfile(updatedUser);

            // Update auth context
            if (updateUser) {
                updateUser(updatedUser);
            }

            showSnackbar('Profile updated successfully!', 'success');
        } catch (error) {
            showSnackbar(error.message || 'Failed to update profile', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();

        // Validate password match
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            showSnackbar('New password and confirmation do not match', 'error');
            return;
        }

        try {
            setLoading(true);
            await apiService.changePassword({
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
                confirmPassword: passwordForm.confirmPassword
            });

            // Clear form
            setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });

            showSnackbar('Password changed successfully!', 'success');
        } catch (error) {
            showSnackbar(error.message || 'Failed to change password', 'error');
        } finally {
            setLoading(false);
        }
    };

    // 2FA Functions
    const load2FAStatus = async () => {
        try {
            const status = await apiService.get2FAStatus();
            setTwoFactorStatus(status);
        } catch (error) {
            console.error('Failed to load 2FA status:', error);
        }
    };

    const handleEnable2FA = async () => {
        try {
            setLoading(true);
            const data = await apiService.enable2FA();
            setTwoFactorSetup({
                sharedKey: data.sharedKey,
                authenticatorUri: data.authenticatorUri,
                qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data.authenticatorUri)}`
            });
            showSnackbar('Scan the QR code with your authenticator app', 'info');
        } catch (error) {
            showSnackbar(error.message || 'Failed to enable 2FA', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify2FA = async (e) => {
        e.preventDefault();
        if (!verificationCode || verificationCode.length !== 6) {
            showSnackbar('Please enter a valid 6-digit code', 'error');
            return;
        }

        try {
            setLoading(true);
            const result = await apiService.verify2FA(verificationCode);

            if (result.success) {
                setRecoveryCodes(result.recoveryCodes);
                setShowRecoveryCodes(true);
                setTwoFactorStatus({
                    isTwoFactorEnabled: true,
                    recoveryCodesLeft: result.recoveryCodes.length
                });
                setTwoFactorSetup({ sharedKey: '', authenticatorUri: '', qrCodeUrl: '' });
                setVerificationCode('');
                showSnackbar('Two-factor authentication enabled successfully!', 'success');
            }
        } catch (error) {
            showSnackbar(error.message || 'Invalid verification code', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDisable2FA = async () => {
        if (!window.confirm('Are you sure you want to disable two-factor authentication? This will make your account less secure.')) {
            return;
        }

        try {
            setLoading(true);
            await apiService.disable2FA();
            setTwoFactorStatus({
                isTwoFactorEnabled: false,
                recoveryCodesLeft: 0
            });
            setRecoveryCodes([]);
            setShowRecoveryCodes(false);
            showSnackbar('Two-factor authentication disabled', 'warning');
        } catch (error) {
            showSnackbar(error.message || 'Failed to disable 2FA', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyRecoveryCodes = () => {
        const codesText = recoveryCodes.join('\n');
        navigator.clipboard.writeText(codesText);
        showSnackbar('Recovery codes copied to clipboard', 'success');
    };

    const showSnackbar = (message, severity) => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    if (!profile && loading) {
        return (
            <>
                <AppBar />
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                    <CircularProgress />
                </Box>
            </>
        );
    }

    return (
        <>
            <AppBar />
            <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
                <Card sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    mb: 3
                }}>
                    <CardContent sx={{ textAlign: 'center', py: 4 }}>
                        <Avatar
                            src={profile?.avatar || authUser?.avatar}
                            alt={profile?.userName || authUser?.userName}
                            sx={{
                                width: 120,
                                height: 120,
                                margin: '0 auto 16px',
                                border: '4px solid white',
                                boxShadow: 3
                            }}
                        />
                        <Typography variant="h4" gutterBottom>
                            {profile?.userName || authUser?.userName}
                        </Typography>
                        <Typography variant="body1" sx={{ opacity: 0.9, mb: 2 }}>
                            {profile?.email || authUser?.email}
                        </Typography>
                        <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
                            {(profile?.roles || authUser?.roles || []).map((role) => (
                                <Chip
                                    key={role}
                                    label={role}
                                    sx={{
                                        bgcolor: 'rgba(255,255,255,0.2)',
                                        color: 'white',
                                        fontWeight: 'bold'
                                    }}
                                />
                            ))}
                        </Stack>
                        {profile?.createdAt && (
                            <Typography variant="caption" sx={{ display: 'block', mt: 2, opacity: 0.8 }}>
                                Member since {new Date(profile.createdAt).toLocaleDateString()}
                            </Typography>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        variant="fullWidth"
                        sx={{ borderBottom: 1, borderColor: 'divider' }}
                    >
                        <Tab icon={<PersonIcon />} label="Profile Info" />
                        <Tab icon={<EditIcon />} label="Edit Profile" />
                        <Tab icon={<LockIcon />} label="Change Password" />
                        <Tab icon={<SecurityIcon />} label="Security (2FA)" />
                    </Tabs>

                    <CardContent>
                        {/* Tab 1: Profile Info */}
                        <TabPanel value={tabValue} index={0}>
                            <Stack spacing={2}>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Username
                                    </Typography>
                                    <Typography variant="body1">
                                        {profile?.userName}
                                    </Typography>
                                </Box>
                                <Divider />
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Email
                                    </Typography>
                                    <Typography variant="body1">
                                        {profile?.email}
                                    </Typography>
                                </Box>
                                <Divider />
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Roles
                                    </Typography>
                                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                        {(profile?.roles || []).map((role) => (
                                            <Chip key={role} label={role} color="primary" size="small" />
                                        ))}
                                    </Stack>
                                </Box>
                                <Divider />
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Account Created
                                    </Typography>
                                    <Typography variant="body1">
                                        {profile?.createdAt ? new Date(profile.createdAt).toLocaleString() : 'N/A'}
                                    </Typography>
                                </Box>
                            </Stack>
                        </TabPanel>

                        {/* Tab 2: Edit Profile */}
                        <TabPanel value={tabValue} index={1}>
                            <Box component="form" onSubmit={handleUpdateProfile}>
                                <Stack spacing={3}>
                                    <TextField
                                        label="Username"
                                        name="userName"
                                        value={editForm.userName}
                                        onChange={handleEditFormChange}
                                        fullWidth
                                        required
                                        disabled={loading}
                                    />
                                    <TextField
                                        label="Email"
                                        name="email"
                                        type="email"
                                        value={editForm.email}
                                        onChange={handleEditFormChange}
                                        fullWidth
                                        required
                                        disabled={loading}
                                    />
                                    <TextField
                                        label="Avatar URL"
                                        name="avatar"
                                        value={editForm.avatar}
                                        onChange={handleEditFormChange}
                                        fullWidth
                                        disabled={loading}
                                        helperText="Enter a URL for your avatar image"
                                    />
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        size="large"
                                        startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                                        disabled={loading}
                                        sx={{
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            '&:hover': {
                                                background: 'linear-gradient(135deg, #5568d3 0%, #65408b 100%)',
                                            }
                                        }}
                                    >
                                        {loading ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                </Stack>
                            </Box>
                        </TabPanel>

                        {/* Tab 3: Change Password */}
                        <TabPanel value={tabValue} index={2}>
                            <Box component="form" onSubmit={handleChangePassword}>
                                <Stack spacing={3}>
                                    <TextField
                                        label="Current Password"
                                        name="currentPassword"
                                        type="password"
                                        value={passwordForm.currentPassword}
                                        onChange={handlePasswordFormChange}
                                        fullWidth
                                        required
                                        disabled={loading}
                                    />
                                    <TextField
                                        label="New Password"
                                        name="newPassword"
                                        type="password"
                                        value={passwordForm.newPassword}
                                        onChange={handlePasswordFormChange}
                                        fullWidth
                                        required
                                        disabled={loading}
                                        helperText="Password must be at least 8 characters with uppercase, lowercase, number, and special character"
                                    />
                                    <TextField
                                        label="Confirm New Password"
                                        name="confirmPassword"
                                        type="password"
                                        value={passwordForm.confirmPassword}
                                        onChange={handlePasswordFormChange}
                                        fullWidth
                                        required
                                        disabled={loading}
                                    />
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        size="large"
                                        startIcon={loading ? <CircularProgress size={20} /> : <LockIcon />}
                                        disabled={loading}
                                        color="secondary"
                                    >
                                        {loading ? 'Changing...' : 'Change Password'}
                                    </Button>
                                </Stack>
                            </Box>
                        </TabPanel>

                        {/* Tab 4: Security (2FA) */}
                        <TabPanel value={tabValue} index={3}>
                            <Stack spacing={3}>
                                {/* 2FA Status */}
                                <Box sx={{
                                    p: 2,
                                    bgcolor: twoFactorStatus.isTwoFactorEnabled ? 'success.light' : 'warning.light',
                                    borderRadius: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2
                                }}>
                                    <ShieldIcon sx={{ fontSize: 40, color: twoFactorStatus.isTwoFactorEnabled ? 'success.dark' : 'warning.dark' }} />
                                    <Box>
                                        <Typography variant="h6">
                                            Two-Factor Authentication {twoFactorStatus.isTwoFactorEnabled ? 'Enabled' : 'Disabled'}
                                        </Typography>
                                        <Typography variant="body2">
                                            {twoFactorStatus.isTwoFactorEnabled
                                                ? `Your account is protected with 2FA. ${twoFactorStatus.recoveryCodesLeft} recovery codes remaining.`
                                                : 'Add an extra layer of security to your account'}
                                        </Typography>
                                    </Box>
                                </Box>

                                {!twoFactorStatus.isTwoFactorEnabled && !twoFactorSetup.qrCodeUrl && (
                                    <Box>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            Two-factor authentication adds an extra layer of security to your account.
                                            You'll need to enter a code from your authenticator app in addition to your password when logging in.
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            startIcon={<SecurityIcon />}
                                            onClick={handleEnable2FA}
                                            disabled={loading}
                                        >
                                            Enable Two-Factor Authentication
                                        </Button>
                                    </Box>
                                )}

                                {/* Setup 2FA - Show QR Code */}
                                {twoFactorSetup.qrCodeUrl && !twoFactorStatus.isTwoFactorEnabled && (
                                    <Box>
                                        <Alert severity="info" sx={{ mb: 2 }}>
                                            Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                                        </Alert>

                                        <Box sx={{ textAlign: 'center', mb: 3 }}>
                                            <img
                                                src={twoFactorSetup.qrCodeUrl}
                                                alt="2FA QR Code"
                                                style={{ maxWidth: '200px', border: '2px solid #ddd', borderRadius: '8px' }}
                                            />
                                        </Box>

                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                            Or enter this key manually:
                                        </Typography>
                                        <Box sx={{
                                            p: 2,
                                            bgcolor: 'grey.100',
                                            borderRadius: 1,
                                            fontFamily: 'monospace',
                                            wordBreak: 'break-all',
                                            mb: 3
                                        }}>
                                            {twoFactorSetup.sharedKey}
                                        </Box>

                                        <Divider sx={{ my: 2 }} />

                                        <Typography variant="subtitle1" gutterBottom>
                                            Verify Setup
                                        </Typography>
                                        <Box component="form" onSubmit={handleVerify2FA}>
                                            <Stack spacing={2}>
                                                <TextField
                                                    label="Enter 6-digit code"
                                                    value={verificationCode}
                                                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                    fullWidth
                                                    required
                                                    disabled={loading}
                                                    helperText="Enter the 6-digit code from your authenticator app"
                                                    inputProps={{ maxLength: 6, pattern: '[0-9]{6}' }}
                                                />
                                                <Button
                                                    type="submit"
                                                    variant="contained"
                                                    color="success"
                                                    disabled={loading || verificationCode.length !== 6}
                                                    startIcon={loading ? <CircularProgress size={20} /> : <ShieldIcon />}
                                                >
                                                    {loading ? 'Verifying...' : 'Verify and Enable 2FA'}
                                                </Button>
                                            </Stack>
                                        </Box>
                                    </Box>
                                )}

                                {/* Recovery Codes Display */}
                                {showRecoveryCodes && recoveryCodes.length > 0 && (
                                    <Box>
                                        <Alert severity="warning" sx={{ mb: 2 }}>
                                            <Typography variant="subtitle2" gutterBottom>
                                                Save Your Recovery Codes
                                            </Typography>
                                            <Typography variant="body2">
                                                Store these codes in a safe place. You can use them to access your account if you lose your authenticator device.
                                                Each code can only be used once.
                                            </Typography>
                                        </Alert>

                                        <Box sx={{
                                            p: 2,
                                            bgcolor: 'grey.100',
                                            borderRadius: 1,
                                            mb: 2
                                        }}>
                                            <Stack spacing={1}>
                                                {recoveryCodes.map((code, index) => (
                                                    <Typography key={index} sx={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                                                        {index + 1}. {code}
                                                    </Typography>
                                                ))}
                                            </Stack>
                                        </Box>

                                        <Button
                                            variant="outlined"
                                            startIcon={<CopyIcon />}
                                            onClick={handleCopyRecoveryCodes}
                                            fullWidth
                                        >
                                            Copy Recovery Codes
                                        </Button>
                                    </Box>
                                )}

                                {/* Disable 2FA */}
                                {twoFactorStatus.isTwoFactorEnabled && (
                                    <Box sx={{ mt: 3 }}>
                                        <Divider sx={{ mb: 2 }} />
                                        <Typography variant="subtitle2" color="error" gutterBottom>
                                            Danger Zone
                                        </Typography>
                                        <Button
                                            variant="outlined"
                                            color="error"
                                            onClick={handleDisable2FA}
                                            disabled={loading}
                                        >
                                            Disable Two-Factor Authentication
                                        </Button>
                                    </Box>
                                )}
                            </Stack>
                        </TabPanel>
                    </CardContent>
                </Card>
            </Container>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    sx={{
                        width: '100%',
                        whiteSpace: 'pre-line' // Allow multi-line error messages
                    }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
}

export default AccountProfile;
