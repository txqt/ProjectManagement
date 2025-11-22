/**
 * Parse error response from API and extract user-friendly error messages
 * Handles multiple error formats:
 * 1. Validation errors: { errors: { field: ["message1", "message2"] } }
 * 2. Custom errors: { error: "message", details: ["detail1", "detail2"] }
 * 3. Simple string errors
 */
export function parseApiError(errorBody) {
    // If it's a JSON string, parse it first
    if (typeof errorBody === 'string') {
        try {
            errorBody = JSON.parse(errorBody);
        } catch {
            // If it's not valid JSON, return as is
            return errorBody;
        }
    }

    // Handle validation errors format (ASP.NET Core ModelState)
    if (errorBody?.errors && typeof errorBody.errors === 'object') {
        const errorMessages = [];
        for (const field in errorBody.errors) {
            const messages = errorBody.errors[field];
            if (Array.isArray(messages)) {
                errorMessages.push(...messages);
            } else {
                errorMessages.push(messages);
            }
        }
        return errorMessages.join('\n');
    }

    // Handle custom error format with details array
    if (errorBody?.details && Array.isArray(errorBody.details)) {
        return errorBody.details.join('\n');
    }

    // Handle simple error message
    if (errorBody?.error) {
        return errorBody.error;
    }

    // Handle message field
    if (errorBody?.message) {
        return errorBody.message;
    }

    // Fallback
    return 'An unexpected error occurred';
}
