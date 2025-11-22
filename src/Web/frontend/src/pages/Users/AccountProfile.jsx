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
    Save as SaveIcon
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
                                        helperText="Password must be at least 6 characters"
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
