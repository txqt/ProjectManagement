import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ThemeModeProvider } from '~/ThemeModeProvider';

createRoot(document.getElementById("root")).render(
    <ThemeModeProvider>
        <App />
    </ThemeModeProvider>
);