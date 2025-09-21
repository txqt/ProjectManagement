import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import AppThemeProvider from './AppThemeProvider.jsx';

createRoot(document.getElementById("root")).render(
    <AppThemeProvider>
        <App />
    </AppThemeProvider>
);