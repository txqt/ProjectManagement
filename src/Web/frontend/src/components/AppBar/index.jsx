import React from 'react'
import { Box, Container } from "@mui/material";
import ThemeSelect from "../../components/ThemeSelect/index";

function AppBar() {
    return (
        <Box
            sx={(theme) => ({
                backgroundColor: "primary.light",
                width: "100%",
                height: theme.custom.appBarHeight,
                display: "flex",
                alignItems: "center",
            })}
        >
            <ThemeSelect label="Appearance" />
        </Box>
    )
}

export default AppBar