import { Routes, Route } from "react-router-dom"
import { LoginPage } from "@/pages/auth/LoginPage"
import { RegisterPage } from "@/pages/auth/RegisterPage"
import { DashboardPage } from "@/pages/dashboard/DashboardPage"
import { LoansPage } from "@/pages/loans/LoansPage"
import { LoanDetailsPage } from "@/pages/loans/LoanDetailsPage"
import { ClientsPage } from "@/pages/clients/ClientsPage"
import { SettingsPage } from "@/pages/settings/SettingsPage"
import { PrivateRoute } from "@/components/PrivateRoute"
import { DashboardLayout } from "@/layouts/DashboardLayout"

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/ingresar" element={<LoginPage />} />
            <Route path="/registrarse" element={<RegisterPage />} />

            <Route element={<PrivateRoute />}>
                <Route element={<DashboardLayout />}>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/prestamos" element={<LoansPage />} />
                    <Route path="/prestamos/:id" element={<LoanDetailsPage />} />
                    <Route path="/clientes" element={<ClientsPage />} />
                    <Route path="/configuracion" element={<SettingsPage />} />
                </Route>
            </Route>
        </Routes>
    )
}