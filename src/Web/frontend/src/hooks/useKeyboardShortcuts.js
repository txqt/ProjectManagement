import { useEffect, useCallback } from 'react';

/**
 * Custom hook for managing keyboard shortcuts
 * @param {Object} shortcuts - Object mapping keys to callback functions
 * @param {boolean} enabled - Whether shortcuts are enabled (default: true)
 * @param {Array} deps - Dependencies array for callbacks
 */
export const useKeyboardShortcuts = (shortcuts, enabled = true, deps = []) => {
    const handleKeyDown = useCallback((event) => {
        if (!enabled) return;

        // Don't trigger shortcuts when typing in inputs, textareas, or contenteditable elements
        const target = event.target;
        const isTyping = target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable;

        // Allow Escape key even when typing
        if (isTyping && event.key !== 'Escape') return;

        // Build the key combination string
        let key = event.key.toLowerCase();
        const modifiers = [];

        if (event.ctrlKey || event.metaKey) modifiers.push('ctrl');
        if (event.altKey) modifiers.push('alt');
        if (event.shiftKey) modifiers.push('shift');

        const combination = modifiers.length > 0
            ? `${modifiers.join('+')}+${key}`
            : key;

        // Check if this combination has a handler
        const handler = shortcuts[combination] || shortcuts[key];

        if (handler) {
            event.preventDefault();
            event.stopPropagation();
            handler(event);
        }
    }, [shortcuts, enabled, ...deps]);

    useEffect(() => {
        if (!enabled) return;

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown, enabled]);
};

/**
 * Hook for global keyboard shortcuts that work across the entire app
 */
export const useGlobalKeyboardShortcuts = (handlers) => {
    useEffect(() => {
        const handleKeyDown = (event) => {
            const target = event.target;
            const isTyping = target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable;

            // Global shortcuts that work even when typing
            const globalKeys = ['escape', '?'];
            const key = event.key.toLowerCase();

            if (!globalKeys.includes(key) && isTyping) return;

            // Handle Ctrl/Cmd + K for command palette
            if ((event.ctrlKey || event.metaKey) && key === 'k') {
                event.preventDefault();
                handlers.onCommandPalette?.();
                return;
            }

            // Handle other global shortcuts
            switch (key) {
                case 'escape':
                    event.preventDefault();
                    handlers.onEscape?.();
                    break;
                case '?':
                    if (!isTyping) {
                        event.preventDefault();
                        handlers.onShowHelp?.();
                    }
                    break;
                case '/':
                    if (!isTyping) {
                        event.preventDefault();
                        handlers.onFocusSearch?.();
                    }
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handlers]);
};

export default useKeyboardShortcuts;
