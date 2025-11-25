import { createContext, useContext } from 'react';
import toast, { Toaster, useToasterStore } from 'react-hot-toast';

const ToastContext = createContext(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        // Fallback to direct toast if context not available
        return {
            success: toast.success,
            error: toast.error,
            loading: toast.loading,
            promise: toast.promise,
            dismiss: toast.dismiss,
        };
    }
    return context;
};

export const ToastProvider = ({ children }) => {
    // Limit toast notifications to 3 at a time
    const { toasts } = useToasterStore();
    const TOAST_LIMIT = 3;

    // Dismiss oldest toast if limit exceeded
    if (toasts.length > TOAST_LIMIT) {
        toast.dismiss(toasts[0].id);
    }

    const showSuccess = (message, options = {}) => {
        return toast.success(message, {
            duration: 3000,
            position: 'top-right',
            ...options,
        });
    };

    const showError = (message, options = {}) => {
        return toast.error(message, {
            duration: 4000,
            position: 'top-right',
            ...options,
        });
    };

    const showLoading = (message, options = {}) => {
        return toast.loading(message, {
            position: 'top-right',
            ...options,
        });
    };

    const showPromise = (promise, messages, options = {}) => {
        return toast.promise(
            promise,
            {
                loading: messages.loading || 'Loading...',
                success: messages.success || 'Success!',
                error: messages.error || 'Error occurred',
            },
            {
                position: 'top-right',
                ...options,
            }
        );
    };

    const dismiss = (toastId) => {
        toast.dismiss(toastId);
    };

    const dismissAll = () => {
        toast.dismiss();
    };

    const value = {
        success: showSuccess,
        error: showError,
        loading: showLoading,
        promise: showPromise,
        dismiss,
        dismissAll,
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <Toaster
                position="top-right"
                reverseOrder={false}
                gutter={8}
                toastOptions={{
                    // Default options
                    duration: 3000,
                    style: {
                        background: '#363636',
                        color: '#fff',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        fontSize: '14px',
                        maxWidth: '500px',
                    },
                    success: {
                        iconTheme: {
                            primary: '#10b981',
                            secondary: '#fff',
                        },
                        style: {
                            background: '#10b981',
                        },
                    },
                    error: {
                        iconTheme: {
                            primary: '#ef4444',
                            secondary: '#fff',
                        },
                        style: {
                            background: '#ef4444',
                        },
                    },
                    loading: {
                        iconTheme: {
                            primary: '#3b82f6',
                            secondary: '#fff',
                        },
                    },
                }}
            />
        </ToastContext.Provider>
    );
};

export default ToastProvider;
