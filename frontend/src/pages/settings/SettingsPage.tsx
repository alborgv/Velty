import { useState, useEffect } from "react"
import { useApi } from "@/hooks/useApi"
import { MdOutlineSave } from "react-icons/md"

export const SettingsPage = () => {
    const { request } = useApi()
    const [monthlyGoal, setMonthlyGoal] = useState("0")
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        fetchSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const fetchSettings = async () => {
        try {
            const res = await request('/api/settings/')
            const data = await res.json()
            setMonthlyGoal(data.monthly_goal)
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        try {
            await request('/api/settings/', {
                method: 'PUT',
                body: JSON.stringify({ monthly_goal: monthlyGoal })
            })
            alert('Configuración guardada')
        } catch (error) {
            console.error(error)
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) return <div className="p-8 pb-32 max-w-7xl mx-auto space-y-6">Cargando configuración...</div>

    return (
        <div className="p-8 pb-32 max-w-7xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Configuración del Sistema</h1>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                <form onSubmit={handleSave} className="space-y-6 max-w-md">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Meta Mensual (COP)</label>
                        <input 
                            type="number" 
                            step="0.01"
                            value={monthlyGoal}
                            onChange={(e) => setMonthlyGoal(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                            required
                        />
                        <p className="text-sm text-gray-500 mt-2">Este valor se mostrará en el progreso de ingresos del dashboard principal.</p>
                    </div>
                    
                    <button 
                        type="submit" 
                        disabled={isSaving}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                        <MdOutlineSave size={20} />
                        {isSaving ? "Guardando..." : "Guardar Cambios"}
                    </button>
                </form>
            </div>
        </div>
    )
}
