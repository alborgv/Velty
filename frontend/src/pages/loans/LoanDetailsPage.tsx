import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
    MdOutlineArrowBack, 
    MdOutlineMoneyOff, 
    MdOutlineCheckCircle, 
    MdOutlineWarning,
    MdOutlineSchedule,
    MdOutlineEdit,
    MdOutlineDeleteOutline
} from "react-icons/md";
import { toast } from "react-hot-toast";
import { useLoan, Loan } from "@/hooks/useLoan";
import { useInstallment, Installment } from "@/hooks/useInstallment";
import { fmt, Avatar, getStatusMeta } from "./components/LoanShared";
import { ConfirmModal } from "@/components/ConfirmModal";

export const LoanDetailsPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { getLoan, updateLoan } = useLoan();
    const { getInstallments, deleteInstallment } = useInstallment();

    const [loan, setLoan] = useState<Loan | null>(null);
    const [installments, setInstallments] = useState<Installment[]>([]);
    const [loading, setLoading] = useState(true);

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editForm, setEditForm] = useState({
        amount: "",
        interest_rate: "",
        term_months: "",
        payment_frequency: "MONTHLY"
    });
    const [errorMsg, setErrorMsg] = useState("");

    // Confirm delete installment
    const [confirmDeleteInst, setConfirmDeleteInst] = useState<{ id: number; number: number } | null>(null);

    const fetchData = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const [loanData, instData] = await Promise.all([
                getLoan(id),
                getInstallments(id)
            ]);
            setLoan(loanData);
            setInstallments(instData);
            setEditForm({
                amount: loanData.amount,
                interest_rate: loanData.interest_rate,
                term_months: loanData.term_months.toString(),
                payment_frequency: loanData.payment_frequency
            });
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleEditSubmission = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");
        try {
            await updateLoan(id as string, {
                amount: editForm.amount,
                interest_rate: editForm.interest_rate,
                term_months: Number(editForm.term_months),
                payment_frequency: editForm.payment_frequency as "MONTHLY" | "BIWEEKLY"
            });
            setIsEditOpen(false);
            toast.success("Préstamo actualizado exitosamente");
            fetchData();
        } catch (error: unknown) {
            const apiErr = error as { data?: { error?: string } };
            setErrorMsg(apiErr?.data?.error || "Ocurrió un error al actualizar el préstamo.");
        }
    };

    const handleDeletePayment = (inst: Installment) => {
        setConfirmDeleteInst({ id: inst.id, number: inst.number });
    };

    const executeDeletePayment = async () => {
        if (!confirmDeleteInst) return;
        try {
            await deleteInstallment(confirmDeleteInst.id);
            toast.success("Pago eliminado y cuotas recalculadas.");
            setConfirmDeleteInst(null);
            fetchData();
        } catch (error: unknown) {
            console.error("Error deleting payment", error);
            const msg = error instanceof Error ? error.message : "Ocurrió un error al eliminar el abono.";
            toast.error(msg);
            setConfirmDeleteInst(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            </div>
        );
    }

    if (!loan) {
        return (
            <div className="bg-white rounded-2xl p-10 text-center border border-gray-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <h2 className="text-xl font-bold text-gray-800">Préstamo no encontrado</h2>
                <button onClick={() => navigate("/prestamos")} className="mt-4 text-blue-500 underline text-sm">Regresar a préstamos</button>
            </div>
        );
    }

    const meta = getStatusMeta(loan.computed_status || loan.status);
    const paidPct = loan.status === "PAID" ? 100 : Math.round((parseFloat(loan.paid_amount || "0") / parseFloat(loan.total_amount_with_interest || loan.amount)) * 100) || 0;

    return (
        <div className="space-y-6">
            {/* Cabecera Navigation */}
            <div className="flex items-center gap-3 mb-2">
                <button 
                    onClick={() => navigate("/prestamos")}
                    className="p-2 bg-white rounded-xl hover:bg-gray-50 border border-gray-200 transition text-gray-500"
                >
                    <MdOutlineArrowBack size={20} />
                </button>
                <h1 className="text-xl font-bold tracking-tight text-gray-900">
                    Detalles del Préstamo <span className="opacity-50">#{loan.id}</span>
                </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Lateral Izquierdo: Resumen y Acciones */}
                <div className="space-y-6">
                    <section className="bg-white rounded-2xl border border-gray-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
                        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-50">
                            <Avatar initials={loan.borrower_name?.substring(0, 2) || "CL"} size="lg" />
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">{loan.borrower_name}</h3>
                                <p className="text-sm font-medium text-gray-500">{loan.borrower_phone || "Sin contacto"}</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-2 mb-4">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Estado</span>
                            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${meta.style}`}>
                                <meta.icon size={14} />
                                {meta.label}
                            </span>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <p className="text-xs font-semibold text-gray-400 mb-1 tracking-wider uppercase">Deuda Total</p>
                                <p className="text-2xl font-black text-gray-900">{fmt(loan.total_amount_with_interest || loan.amount)}</p>
                            </div>
                            
                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden my-3">
                                <div className={`h-full rounded-full transition-all ${paidPct === 100 ? 'bg-gray-300' : 'bg-emerald-400'}`} style={{ width: `${paidPct}%` }} />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100/40">
                                    <p className="text-[11px] font-bold text-emerald-500/70 uppercase">Total Pagado</p>
                                    <p className="text-sm font-bold text-emerald-600">{fmt(loan.paid_amount || 0)}</p>
                                </div>
                                <div className="bg-blue-50 p-3 rounded-xl border border-blue-100/40">
                                    <p className="text-[11px] font-bold text-blue-500/70 uppercase">Saldo Restante</p>
                                    <p className="text-sm font-bold text-blue-600">{fmt(parseFloat(loan.total_amount_with_interest || loan.amount) - parseFloat(loan.paid_amount || "0"))}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 pt-5 border-t border-gray-50">
                            <button 
                                onClick={() => setIsEditOpen(true)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-semibold rounded-xl transition"
                            >
                                <MdOutlineEdit size={18} />
                                Editar Configuraciones
                            </button>
                        </div>
                    </section>

                    <section className="bg-white rounded-2xl border border-gray-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 space-y-4">
                        <h4 className="text-sm font-bold text-gray-900 mb-3">Términos Originales</h4>
                        {[
                            { l: "Capital Prestado", v: fmt(loan.amount) },
                            { l: "Tasa de Interés", v: `${loan.interest_rate}%` },
                            { l: "Frecuencia", v: loan.payment_frequency === 'MONTHLY' ? 'Mensual' : 'Quincenal' },
                            { l: "Plazo", v: `${loan.term_months} meses` },
                            { l: "Fecha Inicio", v: new Date(loan.start_date || loan.created_at).toLocaleDateString() },
                        ].map(it => (
                            <div key={it.l} className="flex justify-between items-center text-sm py-1">
                                <span className="text-gray-500 font-medium">{it.l}</span>
                                <span className="font-bold text-gray-900">{it.v}</span>
                            </div>
                        ))}
                    </section>
                </div>

                {/* Lateral Derecho: Cuotas / Installments */}
                <div className="lg:col-span-2">
                    <section className="bg-white rounded-2xl border border-gray-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden h-full flex flex-col">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <div>
                                <h2 className="text-base font-bold text-gray-900">Historial de Cuotas</h2>
                                <p className="text-xs font-medium text-gray-500 mt-1">{installments.length} plazos programados</p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-xs text-gray-400 font-semibold uppercase tracking-wide bg-white">
                                        <th className="px-6 py-3">#</th>
                                        <th className="px-4 py-3">Fecha de Pago</th>
                                        <th className="px-4 py-3">Desglose (Cap/Int)</th>
                                        <th className="px-4 py-3 text-right">Monto Base</th>
                                        <th className="px-6 py-3 text-right">Estado</th>
                                        <th className="px-4 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {installments.map((inst) => (
                                        <tr key={inst.id} className="hover:bg-gray-50/50 transition group">
                                            <td className="px-6 py-3.5 font-bold text-gray-400">{inst.number}</td>
                                            <td className="px-4 py-3.5">
                                                <div className="font-semibold text-gray-800">{new Date(inst.due_date).toLocaleDateString("es-ES", { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                                                {inst.paid_at && <div className="text-[11px] font-bold text-emerald-500 mt-0.5">Pagado: {new Date(inst.paid_at).toLocaleDateString()}</div>}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <div className="text-xs font-medium text-gray-500">Cap: {fmt(inst.capital)}</div>
                                                <div className="text-xs font-medium text-gray-500">Int: {fmt(inst.interest)}</div>
                                            </td>
                                            <td className="px-4 py-3.5 text-right font-bold text-gray-900">
                                                {fmt(inst.amount)}
                                            </td>
                                            <td className="px-6 py-3.5 text-right">
                                                {inst.status === 'PAID' ? (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                                                        <MdOutlineCheckCircle size={12} /> Pagado
                                                    </span>
                                                ) : inst.status === 'OVERDUE' || (inst.status === 'PENDING' && new Date(inst.due_date) < new Date()) ? (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500">
                                                        <MdOutlineWarning size={12} /> En Mora
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                                        <MdOutlineSchedule size={12} /> Pendiente
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3.5 text-right">
                                                {inst.status === 'PAID' && (
                                                    <button
                                                        onClick={() => handleDeletePayment(inst)}
                                                        title="Eliminar este pago"
                                                        className="text-gray-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition opacity-0 group-hover:opacity-100"
                                                    >
                                                        <MdOutlineDeleteOutline size={18} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {installments.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-10 text-center text-gray-400">
                                                <MdOutlineMoneyOff size={32} className="mx-auto opacity-30 mb-2" />
                                                No hay cuotas programadas
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>

            {/* Modal Editar Préstamo */}
            {isEditOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden border border-gray-200 shadow-xl">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900">Editar Configuraciones de Préstamo</h3>
                            <p className="text-xs text-red-400 font-medium mt-1">Atención: Ciertas modificaciones regenerarán las cuotas no pagadas.</p>
                        </div>
                        <form onSubmit={handleEditSubmission} className="p-6 space-y-4">
                            {errorMsg && (
                                <div className="bg-red-50 border border-red-100 text-red-500 px-3 py-2 text-sm rounded-lg">
                                    {errorMsg}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Monto de la deuda inicial *</label>
                                <input 
                                    required
                                    type="number" 
                                    step="0.01"
                                    value={editForm.amount}
                                    onChange={(e) => setEditForm({...editForm, amount: e.target.value})}
                                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                />
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Interés (%) *</label>
                                    <input 
                                        required
                                        type="number" 
                                        step="0.01"
                                        value={editForm.interest_rate}
                                        onChange={(e) => setEditForm({...editForm, interest_rate: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Frecuencia *</label>
                                    <select 
                                        required
                                        value={editForm.payment_frequency}
                                        onChange={(e) => setEditForm({...editForm, payment_frequency: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="MONTHLY">Mensual</option>
                                        <option value="BIWEEKLY">Quincenal</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Plazo total (meses) *</label>
                                <input 
                                    required
                                    type="number" 
                                    value={editForm.term_months}
                                    onChange={(e) => setEditForm({...editForm, term_months: e.target.value})}
                                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                />
                            </div>
                            <div className="pt-2 flex gap-3">
                                <button 
                                    type="button"
                                    onClick={() => setIsEditOpen(false)}
                                    className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-[#3b82f6] text-white font-medium rounded-lg hover:bg-[#2563eb] transition"
                                >
                                    Guardar Cambios
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirm Delete Payment */}
            {confirmDeleteInst && (
                <ConfirmModal
                    title="Eliminar Cuota"
                    message={`¿Estás seguro de eliminar la cuota #${confirmDeleteInst.number}? Esto recalculará las cuotas pendientes del préstamo.`}
                    confirmLabel="Sí, eliminar"
                    variant="warning"
                    onConfirm={executeDeletePayment}
                    onCancel={() => setConfirmDeleteInst(null)}
                />
            )}
        </div>
    );
};
