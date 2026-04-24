import { AuthTokens } from "../context";
import { ApiError } from "./errors";

export const createHttpClient = ({
    apiUrl,
    tokens,
    onUnauthorized,
}: {
    apiUrl: string;
    tokens: AuthTokens | null;
    onUnauthorized: () => void;
}) => {

    const request = async (
        path: string,
        options: RequestInit = {}
    ) => {
        const isFormData = options.body instanceof FormData;

        const response = await fetch(`${apiUrl}${path}`, {
            ...options,
            headers: {
                ...(tokens?.access && { Authorization: `Bearer ${tokens.access}` }),
                ...(isFormData ? {} : { "Content-Type": "application/json" }),
                ...(options.headers || {}),
            },
        });

        let data: Record<string, unknown> | null = null;
        try {
            data = await response.clone().json();
        } catch {
            // Response body is not JSON
        }

        if (response.status === 401) {
            onUnauthorized();
            throw new ApiError(
                (data?.detail as string) || "Sesión expirada",
                401,
                data
            );
        }

        if (!response.ok) {
            throw new ApiError(
                (data?.detail as string) || "Error en la petición",
                response.status,
                data
            );
        }
        return response;
    };

    return { request };
};
