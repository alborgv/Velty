import { ChangeEvent } from "react";

export interface LoginProps {
    username: string;
    password: string;
}

export interface RegisterProps {
    username: string;
    password: string;
    confirmPassword: string;
}

export interface InputProps {
    id: string;
    label: string;
    type: string;
    placeholder: string;
}

export interface LoginFormProps {
    errors: ErrorsState;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

export interface ErrorsState {
    username?: string;
    password?: string;
    notAuth?: string;
    [key: string]: string | undefined;
}

export interface DecodedToken {
    user_id: number;
    username: string;
    email: string;
    first_name?: string;
    last_name?: string;
    role: string;
    primer_nombre?: string;
    segundo_nombre?: string;
    primer_apellido?: string;
    segundo_apellido?: string;
    numero_identificacion?: string;
    exp: number;
    iat: number;
}

export interface AuthTokens {
    access: string;
    refresh: string;
}

export interface AuthContextType {
    user: DecodedToken | null;
    authTokens: AuthTokens | null;
    loginUser: (formData: LoginProps) => Promise<void>;
    registerUser: (formData: RegisterProps) => Promise<void>;
    handleUnauthorized: () => void;
    logoutUser: () => void;
}
