import { useState, useEffect } from "react"
import {
    MdOutlineHandshake,
    MdOutlineTrendingDown,
    MdOutlineAttachMoney,
    MdOutlineAccountBalance,
    MdOutlineMoreVert,
    MdOutlineAdd,
    MdOutlineSearch,
} from "react-icons/md"
import { useLoan, Loan } from "@/hooks/useLoan"
import { useBorrower, Borrower } from "@/hooks/useBorrower"
import { useDashboardStats, DashboardStats } from "@/hooks/useDashboard"
import { statusMeta, getStatusMeta, fmt, Avatar } from "./components/LoanShared"
import { LoanDetailPanel, PaymentModal, NewLoanModal } from "./components/LoanModals"
import { DataTable, Column } from "@/components/DataTable"
import { ConfirmModal } from "@/components/ConfirmModal"
import { toast } from "react-hot-toast"

type FilterStatus = "Todos" | "ACTIVE" | "OVERDUE" | "PAID"


export const LoansPage = () => {
    const { getLoans, createLoan, registerPayment, deleteLoan, updateLoanStatus } = useLoan()
    const { getBorrowers } = useBorrower()
    const { getStats } = useDashboardStats()

    const [loans, setLoans] = useState<Loan[]>([])
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [borrowers, setBorrowers] = useState<Borrower[]>([])
    
    const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null)
    const [filter, setFilter] = useState<FilterStatus>("Todos")
    const [search, setSearch] = useState("")
    const [loading, setLoading] = useState(true)

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [formParams, setFormParams] = useState({
        borrower: "",
        amount: "",
        start_date: new Date().toISOString().slice(0, 10),
        term_months: "1",
        interest_rate: "0",
        payment_frequency: "MONTHLY"
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Payment Modal State
    const [paymentModalLoan, setPaymentModalLoan] = useState<Loan | null>(null)
    const [paymentParams, setPaymentParams] = useState({
        amount: "",
        paid_at: new Date().toISOString().slice(0, 10),
        note: "",
        pay_only_interest: false
    })
    const [isSubmittingPayment, setIsSubmittingPayment] = useState(false)

    // Confirm delete state
    const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null)

    const handleDelete = async (id: number) => {
        // Find loan name for the confirm modal
        const loan = loans.find(l => l.id === id)
        setConfirmDelete({ id, name: loan?.borrower_name || `#${id}` })
    }

    const executeDelete = async () => {
        if (!confirmDelete) return;
        try {
            await deleteLoan(confirmDelete.id);
            setSelectedLoan(null);
            setConfirmDelete(null);
            toast.success("Préstamo eliminado exitosamente");
            fetchData();
        } catch (error: unknown) {
            console.error("Failed to delete loan", error)
            const msg = error instanceof Error ? error.message : "Ocurrió un error al eliminar el préstamo";
            toast.error(msg);
            setConfirmDelete(null);
        }
    }

    const handleUpdateStatus = async (id: number, status: "ACTIVE" | "PAID" | "OVERDUE") => {
        try {
            await updateLoanStatus(id, status);
            fetchData();
            if (selectedLoan && selectedLoan.id === id) {
                setSelectedLoan({...selectedLoan, status, computed_status: status});
            }
        } catch (error) {
            console.error("Failed to update status", error)
        }
    }

    const handleRegisterPayment = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!paymentModalLoan || (!paymentParams.amount && !paymentParams.pay_only_interest)) return
        setIsSubmittingPayment(true)
        try {
            await registerPayment(paymentModalLoan.id, {
                amount: Number(paymentParams.amount),
                paid_at: paymentParams.paid_at,
                note: paymentParams.note,
                pay_only_interest: !!paymentParams.pay_only_interest
            })
            setPaymentModalLoan(null)
            setSelectedLoan(null)
            setPaymentParams({ amount: "", paid_at: new Date().toISOString().slice(0, 10), note: "", pay_only_interest: false })
            toast.success("Pago registrado exitosamente")
            fetchData()
        } catch (error) {
            console.error(error)
        }
        setIsSubmittingPayment(false)
    }



    const fetchData = async () => {
        setLoading(true)
        try {
            const [loansData, statsData, borrowersData] = await Promise.all([
                getLoans({ status: filter === "Todos" ? undefined : filter, search }),
                getStats(),
                getBorrowers()
            ])
            setLoans(loansData)
            setStats(statsData)
            setBorrowers(borrowersData)
        } catch (error) {
            console.error("Failed to fetch loans data", error)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter, search])

    const handleCreateLoan = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formParams.borrower || !formParams.amount || !formParams.term_months) return
        
        setIsSubmitting(true)
        try {
            await createLoan({
                borrower: Number(formParams.borrower),
                amount: formParams.amount,
                start_date: formParams.start_date,
                term_months: Number(formParams.term_months),
                interest_rate: formParams.interest_rate,
                payment_frequency: formParams.payment_frequency as "MONTHLY" | "BIWEEKLY",
                status: "ACTIVE"
            })
            setIsModalOpen(false)
            setFormParams({
                borrower: "",
                amount: "",
                start_date: new Date().toISOString().slice(0, 10),
                term_months: "1",
                interest_rate: "0",
                payment_frequency: "MONTHLY"
            })
            fetchData()
        } catch (error) {
            console.error(error)
        }
        setIsSubmitting(false)
    }

    const filterTabs: FilterStatus[] = ["Todos", "ACTIVE", "OVERDUE", "PAID"]

    const getColumns = (): Column<Loan>[] => [
        {
            key: "borrower",
            label: "Cliente",
            render: (loan) => (
                <div className="flex items-center gap-3">
                    <Avatar initials={loan.borrower_name?.substring(0, 2) || "CL"} size="sm" />
                    <div>
                        <p className="font-semibold text-gray-800">{loan.borrower_name}</p>
                        <p className="text-xs text-gray-400">#{loan.id}</p>
                    </div>
                </div>
            )
        },
        {
            key: "amount",
            label: "Monto / Saldo",
            render: (loan) => (
                <div>
                    <div className="font-semibold text-gray-800">{fmt(loan.total_amount_with_interest || loan.amount)}</div>
                    <div className="text-xs text-gray-500 font-medium">Saldo: {fmt(parseFloat(loan.total_amount_with_interest || loan.amount) - parseFloat(loan.paid_amount || "0"))}</div>
                </div>
            )
        },
        {
            key: "term",
            label: "Plazo",
            hiddenOnMobile: true,
            render: (loan) => <span className="text-gray-700 font-medium">{loan.term_months} meses</span>
        },
        {
            key: "progress",
            label: "Progreso",
            hiddenOnMobile: true,
            render: (loan) => (
                <div className="flex items-center gap-2 w-32">
                    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-blue-500 h-full rounded-full transition-all" style={{ width: `${Math.min(100, (parseFloat(loan.paid_amount || "0") / parseFloat(loan.total_amount_with_interest || loan.amount)) * 100)}%` }}></div>
                    </div>
                    <span className="text-xs font-semibold text-gray-500">{Math.round((parseFloat(loan.paid_amount || "0") / parseFloat(loan.total_amount_with_interest || loan.amount)) * 100)}%</span>
                </div>
            )
        },
        {
            key: "status",
            label: "Estado",
            render: (loan) => {
                const meta = getStatusMeta(loan.computed_status || loan.status)
                const Icon = meta.icon;
                return (
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${meta.style}`}>
                        <Icon size={12} />
                        {meta.label}
                    </span>
                )
            }
        },
        {
            key: "actions",
            label: "",
            cellClass: "text-right",
            render: () => (
                <MdOutlineMoreVert size={18} className="text-gray-300 opacity-0 group-hover:opacity-100 transition" />
            )
        }
    ]

    return (
        <>
            {/* ── KPI Cards ── */}
            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {[
                    { label: "Capital en Calle", value: fmt(stats?.total_capital || 0), sub: "Total activo", icon: MdOutlineAttachMoney, bg: "bg-blue-50", text: "text-blue-500", iconBg: "bg-blue-100" },
                    { label: "Préstamos Activos", value: stats?.active_loans || 0, sub: "Registrados", icon: MdOutlineHandshake, bg: "bg-emerald-50", text: "text-emerald-500", iconBg: "bg-emerald-100" },
                    { label: "Recaudado (Mes)", value: fmt(stats?.collected_month || 0), sub: "Mes actual", icon: MdOutlineAccountBalance, bg: "bg-violet-50", text: "text-violet-500", iconBg: "bg-violet-100" },
                    { label: "En Mora", value: stats?.overdue_loans || 0, sub: "Requieren atención", icon: MdOutlineTrendingDown, bg: "bg-red-50", text: "text-red-400", iconBg: "bg-red-100" },
                ].map((s) => (
                    <div
                        key={s.label}
                        className="bg-white rounded-2xl p-5 border border-gray-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col gap-3 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-shadow"
                    >
                        <div className="flex items-center justify-between">
                            <span className={`${s.bg} ${s.text} text-xs font-semibold px-2.5 py-1 rounded-lg`}>
                                {s.label}
                            </span>
                            <div className={`${s.iconBg} ${s.text} w-9 h-9 rounded-xl flex items-center justify-center`}>
                                <s.icon size={20} />
                            </div>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800">{s.value}</p>
                            <p className="text-xs mt-0.5 font-medium text-gray-400">
                                {s.sub}
                            </p>
                        </div>
                    </div>
                ))}
            </section>

            {/* ── Tabla de préstamos ── */}
            <section className="bg-white rounded-2xl border border-gray-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-gray-100">
                    <div>
                        <h2 className="text-base font-bold text-gray-900">Cartera de Préstamos</h2>
                        <p className="text-xs text-gray-400 mt-0.5">{loans.length} préstamos · Haz clic para ver detalles</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="hidden sm:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 w-48">
                            <MdOutlineSearch className="text-gray-400" size={18} />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar..."
                                className="bg-transparent text-sm text-gray-600 outline-none w-full placeholder:text-gray-400"
                            />
                        </div>
                        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-1.5 text-sm font-semibold text-white bg-[#3b82f6] px-4 py-2 rounded-xl hover:bg-[#2563eb] transition">
                            <MdOutlineAdd size={18} />
                            Nuevo
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-1 px-6 py-3 border-b border-gray-100 overflow-x-auto">
                    {filterTabs.map((tab) => {
                        const count = tab === "Todos" ? stats?.total_loans || loans.length : (
                            tab === "ACTIVE" ? stats?.active_loans : 
                            tab === "OVERDUE" ? stats?.overdue_loans : 0
                        )
                        const label = tab === "Todos" ? "Todos" : statusMeta[tab].label;
                        return (
                            <button
                                key={tab}
                                onClick={() => setFilter(tab)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                                    filter === tab
                                        ? "bg-gray-800 text-white"
                                        : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                                }`}
                            >
                                {label}
                                {count !== undefined && <span className="opacity-75 text-xs">({count})</span>}
                            </button>
                        )
                    })}
                </div>

                <div className="p-0 border-t border-gray-100">
                    <DataTable 
                        columns={getColumns()} 
                        data={loans} 
                        keyExtractor={l => l.id} 
                        emptyStateMessage="No se encontraron préstamos"
                        loading={loading}
                        onRowClick={(loan) => setSelectedLoan(loan)}
                    />
                </div>
            </section>

            {/* Modal Detail */}
            {selectedLoan && (
                <LoanDetailPanel 
                    loan={selectedLoan} 
                    onClose={() => setSelectedLoan(null)} 
                    onPay={(loan) => setPaymentModalLoan(loan)}
                    onDelete={handleDelete}
                    onUpdateStatus={handleUpdateStatus}
                />
            )}

            {/* Modal Payment */}
            {paymentModalLoan && (
                <PaymentModal 
                    paymentParams={paymentParams}
                    setPaymentParams={setPaymentParams}
                    onClose={() => setPaymentModalLoan(null)}
                    onSubmit={handleRegisterPayment}
                    isSubmitting={isSubmittingPayment}
                />
            )}

            {/* Modal New Loan */}
            {isModalOpen && (
                <NewLoanModal 
                    formParams={formParams}
                    setFormParams={setFormParams}
                    borrowers={borrowers}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={handleCreateLoan}
                    isSubmitting={isSubmitting}
                />
            )}

            {/* Confirm Delete */}
            {confirmDelete && (
                <ConfirmModal
                    title="Eliminar Préstamo"
                    message={`¿Estás seguro de que deseas eliminar el préstamo de "${confirmDelete.name}"? Esta acción es permanente y no se puede deshacer.`}
                    confirmLabel="Sí, eliminar"
                    onConfirm={executeDelete}
                    onCancel={() => setConfirmDelete(null)}
                />
            )}
        </>
    )
}
