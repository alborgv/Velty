import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { createHttpClient } from '../services/http';

export const useApi = () => {
    const { authTokens, handleUnauthorized } = useAuth();
    const urlBackend = import.meta.env.VITE_API_URL;

    const http = useMemo(() => {
        return createHttpClient({
            apiUrl: urlBackend || '',
            tokens: authTokens,
            onUnauthorized: handleUnauthorized
        });
    }, [authTokens, handleUnauthorized, urlBackend]);

    return http;
};
