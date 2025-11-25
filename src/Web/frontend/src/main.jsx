import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ThemeModeProvider } from '~/ThemeModeProvider';
import { ToastContainer } from 'react-toastify';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './contexts/ToastProvider';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeModeProvider>
      <ErrorBoundary>
        <ToastProvider>
          <App />
        </ToastProvider>
      </ErrorBoundary>
    </ThemeModeProvider>
  </React.StrictMode>
);