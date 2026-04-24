import { LoginProps } from "@/context";
import { useServices } from "./useServices";

export const useAuth = () => {

    const services = useServices();

    const loginUser = (formData: LoginProps) => {
        return services?.auth.loginUser(formData);
    };

    return {
        loginUser,
    };
};