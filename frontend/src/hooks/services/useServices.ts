import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { createHttpClient } from "@/services/http";
import { createAuthService } from "@/services/auth.service";

export const useServices = () => {

    const { authTokens, handleUnauthorized } = useAuth();
    const apiUrl = import.meta.env.VITE_API_URL;

    return useMemo(() => {
        if (!authTokens) return null;

        const http = createHttpClient({
            apiUrl,
            tokens: authTokens,
            onUnauthorized: handleUnauthorized
        });

        return {
            auth: createAuthService(http),
        };

    }, [authTokens, apiUrl, handleUnauthorized]);
};