import { MdOutlineWarningAmber, MdOutlineClose } from "react-icons/md"

interface ConfirmModalProps {
    title: string
    message: string
    confirmLabel?: string
    cancelLabel?: string
    variant?: "danger" | "warning"
    onConfirm: () => void
    onCancel: () => void
}

export function ConfirmModal({
    title,
    message,
    confirmLabel = "Eliminar",
    cancelLabel = "Cancelar",
    variant = "danger",
    onConfirm,
    onCancel
}: ConfirmModalProps) {
    const btnColor = variant === "danger"
        ? "bg-red-500 hover:bg-red-600 text-white"
        : "bg-amber-500 hover:bg-amber-600 text-white"

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden border border-gray-200 shadow-xl animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-start gap-4 p-6 pb-4">
                    <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${variant === "danger" ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-500"}`}>
                        <MdOutlineWarningAmber size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-gray-900">{title}</h3>
                        <p className="text-sm text-gray-500 mt-1 leading-relaxed">{message}</p>
                    </div>
                    <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg transition shrink-0 -mt-1 -mr-1">
                        <MdOutlineClose size={20} />
                    </button>
                </div>
                <div className="flex gap-3 px-6 pb-6 pt-2">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition text-sm"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 px-4 py-2.5 font-semibold rounded-xl transition text-sm ${btnColor}`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    )
}
