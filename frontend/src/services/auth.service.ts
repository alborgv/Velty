    import { LoginProps, RegisterProps } from "@/context";
import { ApiError } from "./errors";

    export const createAuthService = (http: {
        request: (path: string, options?: RequestInit) => Promise<Response>;
    }) => ({

        async loginUser(formData: LoginProps) {
            const response = await http.request(
                "/api/login/",
                {
                    method: "POST",
                    body: JSON.stringify(formData),
                }
            );
            const data = await response.json();
            
            if (!response.ok) {
                throw new ApiError(
                    data?.detail || "Request error",
                    response.status,
                    data
                );
            }

            return data;
        },
        
        async registerUser(formData: RegisterProps) {
            const response = await http.request(
                "/api/register/",
                {
                    method: "POST",
                    body: JSON.stringify(formData),
                }
            );
            const data = await response.json();
            
            if (!response.ok) {
                throw new ApiError(
                    data?.detail || "Request error",
                    response.status,
                    data
                );
            }

            return data;
        },


    });
