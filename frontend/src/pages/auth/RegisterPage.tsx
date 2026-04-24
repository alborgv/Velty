import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { ApiError } from "@/services/errors"
import veltyBanner from "@/assets/velty_banner.png"
import { FaRegUser } from "react-icons/fa"
import { MdOutlineLock } from "react-icons/md"

export const RegisterPage = () => {

    const { registerUser } = useAuth()
    const navigate = useNavigate()

    const [form, setForm] = useState({
        username: "",
        password: "",
        confirmPassword: ""
    })

    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {

        e.preventDefault()

        setLoading(true)
        setError(null)

        try {
            await registerUser(form)
            navigate("/ingresar")
        } catch (error) {

            if (error instanceof ApiError) {
                setError(error.message)
            } else {
                setError("Error inesperado")
            }

        }

        setLoading(false)
    }

    return (

        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 px-4">

            <img
                src={veltyBanner}
                alt="Velty"
                className="w-56"
            />

            <form
                onSubmit={handleSubmit}
                className="bg-white p-10 rounded-xl shadow-md w-full max-w-md"
            >

                <h2 className="text-2xl font-semibold mb-6 text-gray-700">
                    Registrarse
                </h2>

                {error && (
                    <div className="mb-4 text-red-500 text-sm">
                        {error}
                    </div>
                )}

                <label className="text-sm text-gray-500">
                    Usuario
                </label>

                <div className="relative mt-1 mb-4">
                    <input
                        type="text"
                        value={form.username}
                        onChange={(e) =>
                            setForm({ ...form, username: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-lg p-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <FaRegUser
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                        size={20}   
                    />

                </div>
                
                <label className="text-sm text-gray-500">
                    Contraseña
                </label>

                <div className="relative mt-1 mb-4">
                    
                    <input
                        type="password"
                        value={form.password}
                        onChange={(e) =>
                            setForm({ ...form, password: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-lg p-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <MdOutlineLock 
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                        size={22} 
                    />

                </div>
                
                <label className="text-sm text-gray-500">
                    Confirmar contraseña
                </label>

                <div className="relative mt-1 mb-4">
                    
                    <input
                        type="password"
                        value={form.confirmPassword}
                        onChange={(e) =>
                            setForm({ ...form, confirmPassword: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-lg p-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <MdOutlineLock 
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                        size={22} 
                    />

                </div>

                <button
                    disabled={loading}
                    className="w-full bg-primary text-white font-semibold py-3 rounded-lg 
                    hover:bg-primary-hover hover:cursor-pointer transition shadow-lg shadow-primary"
                >

                    {loading ? "Registrandose..." : "Registrarse"}

                </button>


                <div className="mt-6 text-center text-sm text-gray-500">
                    ¿Ya tienes cuenta?{" "}
                    <span
                        onClick={() => navigate("/ingresar")}
                        className="underline cursor-pointer text-gray-700 hover:text-blue-400 transition"
                    >
                        Ingresa con tu cuenta
                    </span>

                </div>

            </form>

        </div>
    )
}