import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ThemeModeProvider } from '~/ThemeModeProvider';
import { ToastContainer } from 'react-toastify';

createRoot(document.getElementById("root")).render(
    <ThemeModeProvider>
        <App />
        <ToastContainer
            position="bottom-right"
            autoClose={1000}
            hideProgressBar={true}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
        />
    </ThemeModeProvider>
);