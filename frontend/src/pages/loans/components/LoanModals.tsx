import React from "react"
import { useNavigate } from "react-router-dom"
import {
    MdOutlineClose,
    MdOutlinePhone,
    MdOutlineArrowForward,
} from "react-icons/md"
import { Loan } from "@/hooks/useLoan"
import { Borrower } from "@/hooks/useBorrower"
import { statusMeta, Avatar, ProgressBar, fmt } from "./LoanShared"

export function LoanDetailPanel({ loan, onClose, onPay, onDelete, onUpdateStatus }: { loan: Loan; onClose: () => void; onPay: (loan: Loan) => void; onDelete: (id: number) => void; onUpdateStatus: (id: number, status: "ACTIVE" | "PAID" | "OVERDUE") => void }) {
    const navigate = useNavigate()
    const meta = statusMeta[loan.status || "ACTIVE"] || statusMeta["ACTIVE"]
    const progressColor =
        loan.status === "OVERDUE" ? "bg-rose-500"
        : loan.status === "PAID" ? "bg-gray-400"
        : "bg-emerald-500"
        
    const paidPct = loan.status === "PAID" ? 100 : Math.round((parseFloat(loan.paid_amount || "0") / parseFloat(loan.total_amount_with_interest || loan.amount)) * 100) || 0

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
            <aside className="relative z-10 w-full max-w-sm bg-white h-full overflow-y-auto flex flex-col">
                <div className="bg-[#1a1f2e] px-6 py-6 text-white shrink-0">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-semibold text-white/50 uppercase tracking-widest">Préstamo #{loan.id}</span>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
                        >
                            <MdOutlineClose size={18} />
                        </button>
                    </div>
                    <div className="flex items-center gap-4">
                        <Avatar initials={loan.borrower_name?.substring(0, 2) || "CL"} size="lg" />
                        <div>
                            <h3 className="text-lg font-bold">{loan.borrower_name}</h3>
                            <select 
                                value={loan.status || "ACTIVE"}
                                onChange={(e) => onUpdateStatus(loan.id, e.target.value as "ACTIVE" | "PAID" | "OVERDUE")}
                                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${meta.style} bg-white/20 outline-none cursor-pointer border border-transparent hover:bg-white/30 transition-colors`}
                            >
                                <option value="ACTIVE" className="text-gray-900">Al día</option>
                                <option value="OVERDUE" className="text-gray-900">En mora</option>
                                <option value="PAID" className="text-gray-900">Finalizado</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex-1 px-6 py-6 space-y-6">
                    <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Contacto</p>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                            <MdOutlinePhone className="text-gray-400" size={16} />
                            {loan.borrower_phone || "Sin teléfono"}
                        </div>
                    </div>
                    <div className="border-t border-gray-100" />
                    <div className="space-y-3">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Resumen Financiero</p>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { l: "Monto original", v: fmt(loan.amount) },
                                { l: "Plazo", v: `${loan.term_months} meses` },
                                { l: "Inicio", v: loan.start_date || new Date().toLocaleDateString() },
                            ].map(({ l, v }) => (
                                <div key={l} className="bg-gray-50 rounded-xl p-3">
                                    <p className="text-xs text-gray-400 mb-0.5">{l}</p>
                                    <p className="text-sm font-bold text-gray-800">{v}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="border-t border-gray-100" />
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Progreso de Pago</p>
                            <span className="text-sm font-bold text-gray-800">{paidPct}%</span>
                        </div>
                        <ProgressBar value={paidPct} max={100} color={progressColor} />
                    </div>
                    <div className="border-t border-gray-100" />
                    <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Acciones</p>
                        <button onClick={() => navigate(`/prestamos/${loan.id}`)} className="w-full flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-gray-50 text-gray-700 text-sm font-semibold hover:bg-gray-100 transition shadow-sm mb-2 border border-gray-200">
                            Ver historial y detalles completos
                        </button>
                        <button onClick={() => onPay(loan)} className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-[#3b82f6] text-white text-sm font-semibold hover:bg-[#2563eb] transition mb-2">
                            Registrar Pago
                            <MdOutlineArrowForward size={18} />
                        </button>
                        <button onClick={() => onDelete(loan.id)} className="w-full flex items-center justify-center px-4 py-3 rounded-xl bg-red-50 text-red-500 text-sm font-semibold hover:bg-red-100 transition mt-2 border border-red-100">
                            Eliminar Préstamo
                        </button>
                    </div>
                </div>
            </aside>
        </div>
    )
}

export interface PaymentFormParams {
    amount: string;
    paid_at: string;
    note: string;
    pay_only_interest: boolean;
}

export function PaymentModal({
    paymentParams,
    setPaymentParams,
    onClose,
    onSubmit,
    isSubmitting
}: {
    paymentParams: PaymentFormParams;
    setPaymentParams: (params: PaymentFormParams) => void;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    isSubmitting: boolean;
}) {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden border border-gray-100">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900">Registrar Pago</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
                        <MdOutlineClose size={24} />
                    </button>
                </div>
                <form onSubmit={onSubmit} className="p-6 space-y-4">
                    {!paymentParams.pay_only_interest && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Monto Pagado (COP) *</label>
                            <input 
                                required
                                type="number" 
                                step="0.01"
                                value={paymentParams.amount}
                                onChange={(e) => setPaymentParams({...paymentParams, amount: e.target.value})}
                                placeholder="Ej: 50000"
                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha del Pago *</label>
                        <input 
                            required
                            type="date" 
                            value={paymentParams.paid_at}
                            onChange={(e) => setPaymentParams({...paymentParams, paid_at: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nota (Opcional)</label>
                        <textarea 
                            rows={2}
                            value={paymentParams.note}
                            onChange={(e) => setPaymentParams({...paymentParams, note: e.target.value})}
                            placeholder="Ej: Pago en efectivo..."
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" 
                        ></textarea>
                    </div>
                    <div className="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            id="pay_only_interest"
                            checked={!!paymentParams.pay_only_interest}
                            onChange={(e) => setPaymentParams({...paymentParams, pay_only_interest: e.target.checked, amount: e.target.checked ? '' : paymentParams.amount})}
                            className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-blue-400"
                        />
                        <label htmlFor="pay_only_interest" className="text-sm text-gray-700 select-none">
                            Sólo abonar intereses de esta cuota
                        </label>
                    </div>
                    {paymentParams.pay_only_interest && (
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                            <p className="text-xs text-amber-700 font-medium">Se registrará que pagó únicamente los intereses de la cuota pendiente en la fecha indicada. El capital no se verá afectado.</p>
                        </div>
                    )}
                    <div className="pt-2 flex gap-3">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2 bg-[#3b82f6] text-white font-medium rounded-lg hover:bg-[#2563eb] transition disabled:opacity-50"
                        >
                            {isSubmitting ? "Guardando..." : "Confirmar"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export interface LoanFormParams {
    borrower: string;
    amount: string;
    start_date: string;
    term_months: string;
    interest_rate: string;
    payment_frequency: string;
}

export function NewLoanModal({
    formParams,
    setFormParams,
    borrowers,
    onClose,
    onSubmit,
    isSubmitting
}: {
    formParams: LoanFormParams;
    setFormParams: (params: LoanFormParams) => void;
    borrowers: Borrower[];
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    isSubmitting: boolean;
}) {
    const getFirstPaymentDate = (dateStr: string, freq: string) => {
        if (!dateStr) return "";
        const d = new Date(dateStr + "T12:00:00");
        if (freq === "MONTHLY") {
            d.setMonth(d.getMonth() + 1);
        } else {
            d.setDate(d.getDate() + 15);
        }
        return d.toISOString().slice(0, 10);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden border border-gray-100">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900">Nuevo Préstamo</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
                        <MdOutlineClose size={24} />
                    </button>
                </div>
                <form onSubmit={onSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
                        <select 
                            required
                            value={formParams.borrower}
                            onChange={(e) => setFormParams({...formParams, borrower: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Selecciona un cliente...</option>
                            {borrowers.map(b => (
                                <option key={b.id} value={b.id}>{b.name} ({b.phone})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Monto (COP) *</label>
                        <input 
                            required
                            type="number" 
                            step="0.01"
                            value={formParams.amount}
                            onChange={(e) => setFormParams({...formParams, amount: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        />
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Frecuencia *</label>
                            <select 
                                required
                                value={formParams.payment_frequency}
                                onChange={(e) => setFormParams({...formParams, payment_frequency: e.target.value})}
                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="MONTHLY">Mensual</option>
                                <option value="BIWEEKLY">Quincenal</option>
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Interés (%) *</label>
                            <input 
                                required
                                type="number" 
                                step="0.01"
                                value={formParams.interest_rate}
                                onChange={(e) => setFormParams({...formParams, interest_rate: e.target.value})}
                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                            />
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Plazo (meses) *</label>
                            <input 
                                required
                                type="number" 
                                value={formParams.term_months}
                                onChange={(e) => setFormParams({...formParams, term_months: e.target.value})}
                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Inicio *</label>
                            <input 
                                required
                                type="date" 
                                value={formParams.start_date}
                                onChange={(e) => setFormParams({...formParams, start_date: e.target.value})}
                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                            />
                        </div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 flex items-center justify-between">
                        <span className="text-sm text-blue-800 font-medium">Primer pago:</span>
                        <span className="text-sm text-blue-900 font-bold">
                            {new Date(getFirstPaymentDate(formParams.start_date, formParams.payment_frequency)).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                    </div>
                    <div className="pt-2 flex gap-3">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2 bg-[#3b82f6] text-white font-medium rounded-lg hover:bg-[#2563eb] transition disabled:opacity-50"
                        >
                            {isSubmitting ? "Creando..." : "Crear Préstamo"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
