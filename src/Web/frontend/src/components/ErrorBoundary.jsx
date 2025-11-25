import React from 'react';
import { Box, Typography, Button, Paper, Container } from '@mui/material';
import { Error as ErrorIcon, Refresh as RefreshIcon } from '@mui/icons-material';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log error to console in development
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        // You can also log to an error reporting service here
        // logErrorToService(error, errorInfo);

        this.setState({
            error,
            errorInfo
        });
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    };

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <Container maxWidth="md">
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: '100vh',
                            py: 4,
                        }}
                    >
                        <Paper
                            elevation={3}
                            sx={{
                                p: 4,
                                textAlign: 'center',
                                maxWidth: 600,
                                width: '100%',
                            }}
                        >
                            <ErrorIcon
                                sx={{
                                    fontSize: 80,
                                    color: 'error.main',
                                    mb: 2,
                                }}
                            />

                            <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
                                Oops! Something went wrong
                            </Typography>

                            <Typography variant="body1" color="text.secondary" paragraph>
                                We're sorry for the inconvenience. An unexpected error has occurred.
                            </Typography>

                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <Paper
                                    sx={{
                                        p: 2,
                                        mt: 3,
                                        mb: 3,
                                        bgcolor: 'grey.100',
                                        textAlign: 'left',
                                        maxHeight: 200,
                                        overflow: 'auto',
                                    }}
                                >
                                    <Typography
                                        variant="caption"
                                        component="pre"
                                        sx={{
                                            fontFamily: 'monospace',
                                            fontSize: '0.75rem',
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word',
                                        }}
                                    >
                                        {this.state.error.toString()}
                                        {this.state.errorInfo && (
                                            <>
                                                {'\n\n'}
                                                {this.state.errorInfo.componentStack}
                                            </>
                                        )}
                                    </Typography>
                                </Paper>
                            )}

                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3 }}>
                                <Button
                                    variant="contained"
                                    startIcon={<RefreshIcon />}
                                    onClick={this.handleReload}
                                >
                                    Reload Page
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={this.handleReset}
                                >
                                    Try Again
                                </Button>
                            </Box>
                        </Paper>
                    </Box>
                </Container>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
