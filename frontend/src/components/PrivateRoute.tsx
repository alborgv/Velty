import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"

export const PrivateRoute = () => {
    const { authTokens } = useAuth()

    if (!authTokens) {
        return <Navigate to="/ingresar" replace />
    }

    return <Outlet />
}
