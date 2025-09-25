import { useState, useCallback } from 'react';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const executeRequest = useCallback(async (apiCall) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiCall();
      setLoading(false);
      return { success: true, data: result };
    } catch (error) {
      setError(error.message);
      setLoading(false);
      return { success: false, error: error.message };
    }
  }, []);

  return { loading, error, executeRequest };
};