import { createContext, useContext, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobalKeyboardShortcuts } from '~/hooks/useKeyboardShortcuts';
import KeyboardShortcutsDialog from '~/components/KeyboardShortcutsDialog';

const GlobalKeyboardShortcutsContext = createContext(null);

export const useGlobalKeyboardShortcutsContext = () => {
    const context = useContext(GlobalKeyboardShortcutsContext);
    if (!context) {
        throw new Error('useGlobalKeyboardShortcutsContext must be used within GlobalKeyboardShortcutsProvider');
    }
    return context;
};

export const GlobalKeyboardShortcutsProvider = ({ children }) => {
    const navigate = useNavigate();
    const [showHelp, setShowHelp] = useState(false);
    const [searchFocusCallback, setSearchFocusCallback] = useState(null);
    const [createCardCallback, setCreateCardCallback] = useState(null);

    // Register callbacks from components
    const registerSearchFocus = useCallback((callback) => {
        setSearchFocusCallback(() => callback);
    }, []);

    const registerCreateCard = useCallback((callback) => {
        setCreateCardCallback(() => callback);
    }, []);

    // Global keyboard shortcut handlers
    const handlers = {
        onShowHelp: () => setShowHelp(true),
        onEscape: () => {
            // Close any open dialogs
            setShowHelp(false);
        },
        onFocusSearch: () => {
            if (searchFocusCallback) {
                searchFocusCallback();
            }
        },
        onCommandPalette: () => {
            // TODO: Implement command palette in future
            console.log('Command palette - Coming soon!');
        },
    };

    useGlobalKeyboardShortcuts(handlers);

    const value = {
        registerSearchFocus,
        registerCreateCard,
        showKeyboardHelp: () => setShowHelp(true),
    };

    return (
        <GlobalKeyboardShortcutsContext.Provider value={value}>
            {children}
            <KeyboardShortcutsDialog
                open={showHelp}
                onClose={() => setShowHelp(false)}
            />
        </GlobalKeyboardShortcutsContext.Provider>
    );
};
