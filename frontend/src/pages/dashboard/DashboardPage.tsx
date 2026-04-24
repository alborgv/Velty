import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
    MdOutlineHandshake,
    MdOutlineTrendingDown,
    MdOutlineAttachMoney,
    MdOutlineAccountBalance,
    MdOutlineTrendingUp,
    MdOutlineClose,
    MdOutlineCalendarToday,
    MdOutlineCheckCircle,
    MdOutlineWarning,
} from "react-icons/md"
import { useDashboardStats, DashboardStats } from "@/hooks/useDashboard"
import { useLoan, Loan } from "@/hooks/useLoan"
import { useApi } from "@/hooks/useApi"

// ── Helpers ───────────────────────────────────────────────────────────────────

const statusStyles = {
    "ACTIVE": "bg-emerald-100 text-emerald-700",
    "OVERDUE": "bg-rose-100 text-rose-700",
    "PAID": "bg-gray-100 text-gray-500",
}
const statusText = {
    "ACTIVE": "Al día",
    "OVERDUE": "En mora",
    "PAID": "Finalizado",
}

function getAvatarColor(initials: string) {
    const colors = ["bg-slate-500","bg-sky-500","bg-teal-500","bg-indigo-400","bg-amber-400","bg-pink-400","bg-cyan-500"]
    return colors[(initials?.charCodeAt(0) ?? 0) % colors.length]
}
function Avatar({ initials, size = "md" }: { initials: string; size?: "sm" | "md" }) {
    const color = getAvatarColor(initials)
    const sz = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm"
    return (
        <div className={`${color} ${sz} rounded-full flex items-center justify-center text-white font-semibold shrink-0 uppercase`}>
            {initials}
        </div>
    )
}
function formatCurrency(amount: number) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount)
}

const MON_NAMES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]

// ── Monthly Report Modal ───────────────────────────────────────────────────────
interface MonthlyReport {
    month: number
    year: number
    monthly_goal: number
    total_collected: number
    goal_pct: number
    remaining_goal: number
    payments: {
        id: number
        borrower_name: string
        loan_id: number
        installment_number: number
        amount: number
        paid_at: string | null
        note: string
        loan_amount: number
        loan_total_owed: number
    }[]
    loans_summary: {
        id: number
        borrower_name: string
        amount: number
        total_owed: number
        paid: number
        remaining: number
        status: string
        start_date: string | null
        term_months: number
        interest_rate: number
    }[]
}

function MonthlyReportModal({ onClose, request }: { onClose: () => void; request: ReturnType<typeof useApi>['request'] }) {
    const [report, setReport] = useState<MonthlyReport | null>(null)
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState<'payments' | 'loans'>('payments')

    useEffect(() => {
        request('/api/dashboard/monthly-report/')
            .then(r => r.json())
            .then(setReport)
            .catch(console.error)
            .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100">
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-[#1a1f2e] rounded-t-3xl">
                    <div>
                        <h2 className="text-white text-xl font-bold">Reporte Mensual</h2>
                        {report && (
                            <p className="text-white/50 text-sm">{MON_NAMES[report.month - 1]} {report.year}</p>
                        )}
                    </div>
                    <button onClick={onClose} className="text-white/50 hover:text-white transition">
                        <MdOutlineClose size={24} />
                    </button>
                </div>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
                    </div>
                ) : !report ? (
                    <div className="flex-1 flex items-center justify-center text-gray-400 py-20">
                        <p>No se pudo cargar el reporte.</p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto">
                        {/* Goal Summary */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6 bg-gray-50 border-b border-gray-100">
                            <div className="bg-white rounded-2xl p-4 border border-gray-100">
                                <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Cobrado este mes</p>
                                <p className="text-2xl font-bold text-gray-900">{formatCurrency(report.total_collected)}</p>
                            </div>
                            <div className="bg-white rounded-2xl p-4 border border-gray-100">
                                <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Meta mensual</p>
                                <p className="text-2xl font-bold text-gray-900">{formatCurrency(report.monthly_goal)}</p>
                            </div>
                            <div className="bg-white rounded-2xl p-4 border border-gray-100">
                                <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Pendiente de meta</p>
                                <p className="text-2xl font-bold text-red-500">{formatCurrency(report.remaining_goal)}</p>
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div className="px-6 py-4 border-b border-gray-100">
                            <div className="flex justify-between text-xs font-semibold text-gray-500 mb-1.5">
                                <span>Progreso hacia la meta</span>
                                <span>{report.goal_pct}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-blue-400 transition-all"
                                    style={{ width: `${Math.min(100, report.goal_pct)}%` }}
                                />
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-gray-100">
                            <button
                                onClick={() => setTab('payments')}
                                className={`flex-1 py-3 text-sm font-semibold transition-colors ${tab === 'payments' ? 'text-gray-800 border-b-2 border-gray-800' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                Pagos del mes ({report.payments.length})
                            </button>
                            <button
                                onClick={() => setTab('loans')}
                                className={`flex-1 py-3 text-sm font-semibold transition-colors ${tab === 'loans' ? 'text-gray-800 border-b-2 border-gray-800' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                Préstamos activos ({report.loans_summary.length})
                            </button>
                        </div>

                        {/* Payments tab */}
                        {tab === 'payments' && (
                            <div className="p-6">
                                {report.payments.length === 0 ? (
                                    <p className="text-sm text-gray-400 text-center py-10">No hay pagos registrados este mes.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {report.payments.map(p => (
                                            <div key={p.id} className="flex items-center justify-between bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100 hover:bg-blue-50 transition">
                                                <div className="flex items-center gap-3">
                                                    <Avatar initials={p.borrower_name.substring(0, 2)} size="sm" />
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-800">{p.borrower_name}</p>
                                                        <p className="text-xs text-gray-400 flex items-center gap-1">
                                                            <MdOutlineCalendarToday size={11} />
                                                            {p.paid_at ? new Date(p.paid_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                                            {p.note && <span className="ml-2 italic">· {p.note}</span>}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="text-base font-bold text-emerald-500">+{formatCurrency(p.amount)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Loans tab */}
                        {tab === 'loans' && (
                            <div className="p-6">
                                {report.loans_summary.length === 0 ? (
                                    <p className="text-sm text-gray-400 text-center py-10">No hay préstamos activos.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {report.loans_summary.map(loan => {
                                            const pct = loan.total_owed > 0 ? Math.round((loan.paid / loan.total_owed) * 100) : 0
                                            const isOverdue = loan.status === 'OVERDUE'
                                            return (
                                                <div key={loan.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-100 hover:shadow-sm transition">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar initials={loan.borrower_name.substring(0, 2)} size="sm" />
                                                            <div>
                                                                <p className="text-sm font-bold text-gray-800">{loan.borrower_name}</p>
                                                                <p className="text-xs text-gray-400">{loan.term_months} mes{loan.term_months !== 1 ? 'es' : ''} · {loan.interest_rate}% / mes</p>
                                                            </div>
                                                        </div>
                                                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${isOverdue ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                            {isOverdue ? <MdOutlineWarning size={12} /> : <MdOutlineCheckCircle size={12} />}
                                                            {statusText[loan.status as keyof typeof statusText] || loan.status}
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-3 mt-3 text-center text-xs">
                                                        <div className="bg-white rounded-xl p-2 border border-gray-100">
                                                            <p className="text-gray-400 font-medium">Capital</p>
                                                            <p className="font-bold text-gray-700">{formatCurrency(loan.amount)}</p>
                                                        </div>
                                                        <div className="bg-white rounded-xl p-2 border border-gray-100">
                                                            <p className="text-gray-400 font-medium">Total adeudado</p>
                                                            <p className="font-bold text-blue-500">{formatCurrency(loan.total_owed)}</p>
                                                        </div>
                                                        <div className="bg-white rounded-xl p-2 border border-gray-100">
                                                            <p className="text-gray-400 font-medium">Saldo restante</p>
                                                            <p className={`font-bold ${loan.remaining > 0 ? 'text-red-400' : 'text-emerald-500'}`}>{formatCurrency(loan.remaining)}</p>
                                                        </div>
                                                    </div>
                                                    <div className="mt-3">
                                                        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                                                            <span>Pagado: {formatCurrency(loan.paid)}</span>
                                                            <span>{pct}%</span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, pct)}%` }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export const DashboardPage = () => {
    const { getStats } = useDashboardStats()
    const { getLoans } = useLoan()
    const navigate = useNavigate()
    const { request } = useApi()

    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [recentLoans, setRecentLoans] = useState<Loan[]>([])
    const [loading, setLoading] = useState(true)
    const [showReport, setShowReport] = useState(false)

    const fetchData = async () => {
        setLoading(true)
        try {
            const [statsData, loansData] = await Promise.all([getStats(), getLoans()])
            setStats(statsData)
            setRecentLoans(loansData.slice(0, 7))
        } catch (error) {
            console.error("Failed to load dashboard data", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getStats, getLoans])

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            </div>
        )
    }

    const statCards = stats ? [
        { label: "Capital Activo (Calle)", value: formatCurrency(stats.total_capital), change: "En progreso", icon: MdOutlineAttachMoney, bg: "bg-blue-50", text: "text-blue-500", iconBg: "bg-blue-100" },
        { label: "Préstamos Activos", value: stats.active_loans.toString(), change: "Activos", icon: MdOutlineHandshake, bg: "bg-emerald-50", text: "text-emerald-500", iconBg: "bg-emerald-100" },
        { label: "Cobrado este Mes", value: formatCurrency(stats.collected_month), change: "Mensual", icon: MdOutlineAccountBalance, bg: "bg-violet-50", text: "text-violet-500", iconBg: "bg-violet-100" },
        { label: "En Mora", value: stats.overdue_loans.toString(), change: "Atención", icon: MdOutlineTrendingDown, bg: "bg-red-50", text: "text-red-400", iconBg: "bg-red-100" },
    ] : []

    return (
        <>
            {/* ── KPI Cards ── */}
            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {statCards.map((s) => (
                    <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col gap-3 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-shadow">
                        <div className="flex items-center justify-between">
                            <span className={`${s.bg} ${s.text} text-xs font-semibold px-2.5 py-1 rounded-lg`}>{s.label}</span>
                            <div className={`${s.iconBg} ${s.text} w-9 h-9 rounded-xl flex items-center justify-center`}>
                                <s.icon size={20} />
                            </div>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800">{s.value}</p>
                            <p className="text-xs mt-0.5 font-medium text-gray-400">
                                {s.change}
                            </p>
                        </div>
                    </div>
                ))}
            </section>

            {/* ── Widgets ── */}
            {stats && (
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    {/* Distribución */}
                    <div className="bg-white rounded-3xl p-6 border border-gray-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col gap-4">
                        <h3 className="text-lg font-bold text-gray-900">Distribución por Estado</h3>
                        <div className="space-y-4 mt-2">
                            {[
                                { label: "Al día", count: stats.active_loans, total: stats.total_loans, bg: "bg-emerald-100 text-emerald-700", bar: "bg-emerald-400" },
                                { label: "En mora", count: stats.overdue_loans, total: stats.total_loans, bg: "bg-rose-100 text-rose-700", bar: "bg-rose-400" },
                                { label: "Finalizado", count: stats.paid_loans, total: stats.total_loans, bg: "bg-gray-100 text-gray-600", bar: "bg-gray-300" }
                            ].map((item) => {
                                const pct = item.total > 0 ? Math.round((item.count / item.total) * 100) : 0
                                return (
                                    <div key={item.label} className="flex flex-col gap-1.5">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className={`px-2.5 py-0.5 rounded-full font-semibold text-xs ${item.bg}`}>{item.label}</span>
                                            <span className="font-semibold text-gray-600">{item.count} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                            <div className={`${item.bar} h-full rounded-full transition-all`} style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Meta Mensual */}
                    <div className="bg-[#1a1f2e] rounded-3xl p-6 flex flex-col justify-between text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 -mr-10 -mt-10" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 -ml-10 -mb-10" />
                        <div className="relative z-10">
                            <h3 className="text-xs font-bold text-gray-400 tracking-wider uppercase mb-2">META MENSUAL</h3>
                            <p className="text-4xl font-extrabold text-white">{formatCurrency(stats.collected_month)}</p>
                            <p className="text-sm text-gray-400 mt-1">de {formatCurrency(stats.monthly_goal)} objetivo</p>
                            <div className="mt-8 mb-2">
                                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                                    <div className="bg-blue-400/80 h-full rounded-full" style={{ width: `${Math.min(100, (stats.collected_month / stats.monthly_goal) * 100)}%` }} />
                                </div>
                                <div className="flex items-center justify-between mt-2 text-xs font-semibold text-gray-400">
                                    <span>{Math.round((stats.collected_month / stats.monthly_goal) * 100)}% completado</span>
                                    <span>{formatCurrency(Math.max(0, stats.monthly_goal - stats.collected_month))} pendiente</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowReport(true)}
                            className="relative z-10 w-full mt-4 bg-white/10 hover:bg-white/20 transition-colors py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                        >
                            <MdOutlineTrendingUp size={18} />
                            Ver reporte completo
                        </button>
                    </div>

                    {/* Próximos Cobros */}
                    <div className="bg-white rounded-3xl p-6 border border-gray-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Próximos Cobros</h3>
                        <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
                            {stats.upcoming_collections && stats.upcoming_collections.length > 0 ? (
                                stats.upcoming_collections.map((coll) => (
                                    <div key={coll.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Avatar initials={coll.borrower_name.substring(0, 2)} />
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">{coll.borrower_name}</p>
                                                <p className="text-xs font-semibold text-gray-400">{new Date(coll.due_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-1">
                                            <span className="text-sm font-bold text-blue-500">{formatCurrency(coll.amount)}</span>
                                            <div className="flex items-center gap-2">
                                                <p className="text-[10px] font-bold text-red-400 bg-red-50 px-2 py-0.5 rounded-md">Pte.</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-400 text-center mt-4">No hay cobros próximos.</p>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* ── Main grid ── */}
            <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Loans table */}
                <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                        <div>
                            <h2 className="text-base font-bold text-gray-900">Préstamos Recientes</h2>
                            <p className="text-xs text-gray-400 mt-0.5">Últimos {recentLoans.length} registrados</p>
                        </div>
                        <button onClick={() => navigate('/prestamos')} className="text-xs font-semibold text-blue-600 hover:underline">Ver todos</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs text-gray-400 font-semibold uppercase tracking-wide">
                                    <th className="px-6 py-3">Cliente</th>
                                    <th className="px-4 py-3">Monto</th>
                                    <th className="px-4 py-3">Creado</th>
                                    <th className="px-4 py-3">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {recentLoans.length > 0 ? recentLoans.map((loan) => (
                                    <tr key={loan.id} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-3">
                                                <Avatar initials={loan.borrower_name ? loan.borrower_name.substring(0, 2) : "CL"} size="sm" />
                                                <div>
                                                    <p className="font-semibold text-gray-800">{loan.borrower_name}</p>
                                                    <p className="text-xs text-gray-400">ID #{loan.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-700 font-medium">{formatCurrency(parseFloat(loan.amount))}</td>
                                        <td className="px-4 py-3 text-gray-500 text-xs">{new Date(loan.created_at).toLocaleDateString()}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusStyles[loan.status || "ACTIVE"]}`}>
                                                {statusText[loan.status || "ACTIVE"]}
                                            </span>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No hay préstamos recientes</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagos recientes */}
                <div className="bg-white rounded-2xl border border-gray-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                        <h2 className="text-base font-bold text-gray-900">Pagos Recientes</h2>
                        <MdOutlineTrendingUp className="text-emerald-400" size={20} />
                    </div>
                    <div className="flex-1 p-4 flex flex-col gap-3 overflow-y-auto">
                        {stats?.recent_payments && stats.recent_payments.length > 0 ? (
                            stats.recent_payments.map((payment) => (
                                <div key={payment.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition">
                                    <div className="flex items-center gap-3">
                                        <Avatar initials={payment.borrower_name.substring(0, 2)} size="sm" />
                                        <div>
                                            <p className="text-sm font-semibold text-gray-800">{payment.borrower_name}</p>
                                            <p className="text-xs text-gray-500">{new Date(payment.paid_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-emerald-500">+{formatCurrency(payment.amount)}</span>
                                </div>
                            ))
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-gray-400">
                                <p className="text-sm">No hay pagos recientes.</p>
                            </div>
                        )}
                    </div>
                    <div className="mx-6 mb-5 rounded-xl bg-[#1a1f2e] p-4 text-white">
                        <p className="text-xs font-semibold opacity-60 mb-1">Total Créditos Activos</p>
                        <p className="text-2xl font-bold">{stats?.active_loans}</p>
                    </div>
                </div>
            </section>

            {/* ── Monthly Report Modal ── */}
            {showReport && (
                <MonthlyReportModal
                    onClose={() => setShowReport(false)}
                    request={request}
                />
            )}
        </>
    )
}
