import React, { useState, useEffect } from "react"

export interface Column<T> {
    key: string;
    label: string;
    render?: (item: T) => React.ReactNode;
    hiddenOnMobile?: boolean;
    headerClass?: string;
    cellClass?: string;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    itemsPerPage?: number;
    keyExtractor: (item: T) => string | number;
    emptyStateMessage?: string;
    emptyStateIcon?: React.ReactNode;
    onRowClick?: (item: T) => void;
    loading?: boolean;
}

export function DataTable<T>({
    columns,
    data,
    itemsPerPage = 10,
    keyExtractor,
    emptyStateMessage = "No se encontraron datos",
    emptyStateIcon,
    onRowClick,
    loading = false
}: DataTableProps<T>) {
    const [page, setPage] = useState(1);

    // Reset pagination when data changes significantly (e.g. searching)
    useEffect(() => {
        setPage(1);
    }, [data.length]);

    const totalPages = Math.ceil(data.length / itemsPerPage);
    const paginatedData = data.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    return (
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left text-xs text-gray-400 font-semibold uppercase tracking-wide bg-gray-50/50">
                            {columns.map((col) => (
                                <th 
                                    key={col.key} 
                                    className={`px-6 py-3 ${col.hiddenOnMobile ? 'hidden md:table-cell' : ''} ${col.headerClass || ''}`}
                                >
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-8 text-center">
                                    <div className="flex justify-center">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
                                    </div>
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-400">
                                    {emptyStateIcon && <div className="flex justify-center mb-3 opacity-50">{emptyStateIcon}</div>}
                                    <p className="font-medium text-gray-500">{emptyStateMessage}</p>
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map((item) => (
                                <tr 
                                    key={keyExtractor(item)}
                                    onClick={() => onRowClick && onRowClick(item)}
                                    className={`transition-colors ${onRowClick ? 'hover:bg-gray-50/80 cursor-pointer group' : 'hover:bg-gray-50/50 group'}`}
                                >
                                    {columns.map((col) => (
                                        <td 
                                            key={col.key} 
                                            className={`px-6 py-3.5 ${col.hiddenOnMobile ? 'hidden md:table-cell' : ''} ${col.cellClass || ''}`}
                                        >
                                            {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? '')}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {data.length > itemsPerPage && !loading && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-white rounded-b-2xl">
                    <span className="text-sm text-gray-500 font-medium">
                        Mostrando {(page - 1) * itemsPerPage + 1} a {Math.min(page * itemsPerPage, data.length)} de {data.length}
                    </span>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={(e) => { e.stopPropagation(); setPage(Math.max(1, page - 1)) }}
                            disabled={page === 1}
                            className="px-3 py-1.5 text-sm font-semibold border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent transition"
                        >
                            Anterior
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); setPage(Math.min(totalPages, page + 1)) }}
                            disabled={page === totalPages}
                            className="px-3 py-1.5 text-sm font-semibold border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent transition"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
