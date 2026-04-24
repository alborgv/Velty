import { useState, useEffect } from "react"
import {
    MdOutlinePhone, MdOutlineSearch, MdOutlineAdd, MdOutlineClose,
    MdOutlineWarning, MdOutlineEdit, MdOutlineNote, MdOutlineDeleteOutline
} from "react-icons/md"
import { useBorrower, Borrower } from "@/hooks/useBorrower"
import { useSearchParams } from "react-router-dom"
import { DataTable, Column } from "@/components/DataTable"
import { ConfirmModal } from "@/components/ConfirmModal"
import { toast } from "react-hot-toast"

function Avatar({ initials }: { initials: string }) {
    const avatarPalette = [
        "bg-slate-500", "bg-sky-500", "bg-teal-500",
        "bg-indigo-400", "bg-amber-400", "bg-pink-400", "bg-cyan-500", "bg-violet-400",
    ]
    const color = avatarPalette[initials.charCodeAt(0) % avatarPalette.length] || avatarPalette[0];

    return (
        <div className={`${color} w-10 h-10 text-sm rounded-full flex items-center justify-center text-white font-bold shrink-0`}>
            {initials}
        </div>
    )
}

interface ClientFormData {
    name: string
    phone: string
    note: string
}

const emptyForm: ClientFormData = { name: "", phone: "", note: "" }

export const ClientsPage = () => {
    const { getBorrowers, createBorrower, updateBorrower, deleteBorrower } = useBorrower()
    const [clients, setClients] = useState<Borrower[]>([])
    const [loading, setLoading] = useState(true)
    const [searchParams, setSearchParams] = useSearchParams()

    const initialSearch = searchParams.get('search') || ''
    const [search, setSearch] = useState(initialSearch)

    // Create modal
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [createForm, setCreateForm] = useState<ClientFormData>(emptyForm)
    const [isCreating, setIsCreating] = useState(false)

    // Edit modal
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [editingClient, setEditingClient] = useState<Borrower | null>(null)
    const [editForm, setEditForm] = useState<ClientFormData>(emptyForm)
    const [isSaving, setIsSaving] = useState(false)

    // Confirm delete
    const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null)

    const fetchClients = async (query = "") => {
        setLoading(true)
        try {
            const data = await getBorrowers(query)
            setClients(data)
        } catch (error) {
            console.error("Error fetching clients", error)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchClients(initialSearch)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialSearch])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setSearchParams(search ? { search } : {})
    }

    const handleCreateClient = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!createForm.name) return
        setIsCreating(true)
        try {
            await createBorrower(createForm)
            setIsCreateOpen(false)
            setCreateForm(emptyForm)
            toast.success("Cliente creado exitosamente")
            fetchClients(search)
        } catch (error) {
            console.error("Error creating client", error)
            toast.error("Ocurrió un error al crear el cliente")
        }
        setIsCreating(false)
    }

    const openEditModal = (client: Borrower) => {
        setEditingClient(client)
        setEditForm({ name: client.name, phone: client.phone || "", note: client.note || "" })
        setIsEditOpen(true)
    }

    const handleEditClient = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingClient || !editForm.name) return
        setIsSaving(true)
        try {
            await updateBorrower(editingClient.id, editForm)
            setIsEditOpen(false)
            setEditingClient(null)
            toast.success("Cliente actualizado exitosamente")
            fetchClients(search)
        } catch (error) {
            console.error("Error updating client", error)
            toast.error("Ocurrió un error al actualizar el cliente")
        }
        setIsSaving(false)
    }

    const handleDeleteClient = (client: Borrower) => {
        setConfirmDelete({ id: client.id, name: client.name })
    }

    const executeDelete = async () => {
        if (!confirmDelete) return;
        try {
            await deleteBorrower(confirmDelete.id);
            toast.success("Cliente eliminado exitosamente");
            setConfirmDelete(null);
            fetchClients(search);
        } catch (error: unknown) {
            console.error("Error deleting client", error);
            const msg = error instanceof Error ? error.message : "Ocurrió un error al eliminar el cliente. Puede tener préstamos asociados.";
            toast.error(msg);
            setConfirmDelete(null);
        }
    }

    const columns: Column<Borrower>[] = [
        {
            key: "name",
            label: "Cliente",
            render: (client) => (
                <div className="flex items-center gap-3">
                    <Avatar initials={client.name.substring(0, 2).toUpperCase()} />
                    <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-gray-900 truncate">{client.name}</h3>
                    </div>
                </div>
            )
        },
        {
            key: "phone",
            label: "Teléfono",
            render: (client) => (
                <p className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                    <MdOutlinePhone size={16} className="text-gray-400" />
                    {client.phone || "Sin teléfono"}
                </p>
            )
        },
        {
            key: "note",
            label: "Anotaciones",
            hiddenOnMobile: true,
            render: (client) => (
                client.note ? (
                    <div className="flex items-start gap-1.5 max-w-xs">
                        <MdOutlineNote size={14} className="text-gray-400 mt-0.5 shrink-0" />
                        <p className="text-xs text-gray-600 line-clamp-2">{client.note}</p>
                    </div>
                ) : <span className="text-gray-400 text-xs italic">Ninguna</span>
            )
        },
        {
            key: "actions",
            label: "",
            cellClass: "text-right",
            render: (client) => (
                <div className="flex items-center justify-end gap-1">
                    <button
                        onClick={(e) => { e.stopPropagation(); openEditModal(client) }}
                        title="Editar cliente"
                        className="text-gray-400 hover:text-blue-500 p-1.5 rounded-lg hover:bg-blue-50 transition"
                    >
                        <MdOutlineEdit size={17} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteClient(client) }}
                        title="Eliminar cliente"
                        className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition"
                    >
                        <MdOutlineDeleteOutline size={17} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <section className="bg-white rounded-2xl border border-gray-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Directorio de Clientes</h2>
                    <p className="text-sm text-gray-500 mt-1">{clients.length} clientes registrados</p>
                </div>

                <div className="flex w-full md:w-auto items-center gap-3">
                    <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                        <MdOutlineSearch className="text-gray-400" size={20} />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar por nombre..."
                            className="bg-transparent text-sm text-gray-700 outline-none w-full placeholder:text-gray-400"
                        />
                    </form>
                    <button
                        onClick={() => { setCreateForm(emptyForm); setIsCreateOpen(true) }}
                        className="flex items-center gap-1.5 text-sm font-semibold text-white bg-[#3b82f6] px-4 py-2.5 rounded-xl hover:bg-[#2563eb] transition shrink-0"
                    >
                        <MdOutlineAdd size={18} />
                        Nuevo
                    </button>
                </div>
            </section>

            {loading ? (
                <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                </div>
            ) : (
                <DataTable 
                    columns={columns} 
                    data={clients} 
                    keyExtractor={c => c.id} 
                    emptyStateMessage="No se encontraron clientes. Intenta con otra búsqueda o crea uno nuevo."
                    emptyStateIcon={<MdOutlineWarning size={40} />}
                />
            )}

            {/* ── Modal: Nuevo Cliente ── */}
            {isCreateOpen && (
                <ClientModal
                    title="Nuevo Cliente"
                    form={createForm}
                    onChange={setCreateForm}
                    onSubmit={handleCreateClient}
                    onClose={() => setIsCreateOpen(false)}
                    isSubmitting={isCreating}
                    submitLabel="Guardar Cliente"
                />
            )}

            {/* ── Modal: Editar Cliente ── */}
            {isEditOpen && editingClient && (
                <ClientModal
                    title={`Editar: ${editingClient.name}`}
                    form={editForm}
                    onChange={setEditForm}
                    onSubmit={handleEditClient}
                    onClose={() => { setIsEditOpen(false); setEditingClient(null) }}
                    isSubmitting={isSaving}
                    submitLabel="Guardar Cambios"
                />
            )}

            {/* ── Confirm Delete ── */}
            {confirmDelete && (
                <ConfirmModal
                    title="Eliminar Cliente"
                    message={`¿Estás seguro de que deseas eliminar a "${confirmDelete.name}"? Esta acción es permanente y eliminará todos sus datos.`}
                    confirmLabel="Sí, eliminar"
                    onConfirm={executeDelete}
                    onCancel={() => setConfirmDelete(null)}
                />
            )}
        </div>
    )
}

// ── Reusable form modal ──
interface ClientModalProps {
    title: string
    form: ClientFormData
    onChange: (form: ClientFormData) => void
    onSubmit: (e: React.FormEvent) => void
    onClose: () => void
    isSubmitting: boolean
    submitLabel: string
}

function ClientModal({ title, form, onChange, onSubmit, onClose, isSubmitting, submitLabel }: ClientModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden border border-gray-200 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition">
                        <MdOutlineClose size={24} />
                    </button>
                </div>
                <form onSubmit={onSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo *</label>
                        <input
                            required
                            type="text"
                            value={form.name}
                            onChange={(e) => onChange({ ...form, name: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                        <input
                            type="text"
                            value={form.phone}
                            onChange={(e) => onChange({ ...form, phone: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nota / Dirección</label>
                        <textarea
                            rows={3}
                            value={form.note}
                            onChange={(e) => onChange({ ...form, note: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        />
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
                            {isSubmitting ? "Guardando..." : submitLabel}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
