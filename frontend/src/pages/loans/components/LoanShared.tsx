/* eslint-disable react-refresh/only-export-components */
import React from "react"
import {
    MdOutlineCheckCircle,
    MdOutlineWarning,
    MdOutlineBlock,
} from "react-icons/md"

export const statusMeta: Record<string, { style: string; icon: React.ElementType; label: string }> = {
    "ACTIVE":     { style: "bg-emerald-50 text-emerald-600", icon: MdOutlineCheckCircle, label: "Al día" },
    "OVERDUE":    { style: "bg-red-50 text-red-500",         icon: MdOutlineWarning,      label: "En mora" },
    "PAID":       { style: "bg-gray-100 text-gray-500",      icon: MdOutlineBlock,        label: "Finalizado" },
}

export function getStatusMeta(status: string | undefined) {
    return statusMeta[status || "ACTIVE"] || statusMeta["ACTIVE"]
}

export const avatarPalette = [
    "bg-slate-500", "bg-sky-500", "bg-teal-500",
    "bg-indigo-400", "bg-amber-400", "bg-pink-400", "bg-cyan-500", "bg-violet-400",
]

export function getAvatarColor(initials: string) {
    return avatarPalette[initials ? initials.charCodeAt(0) % avatarPalette.length : 0]
}

export function fmt(n: string | number) {
    if (!n) return "$0";
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(n))
}

export function Avatar({ initials, size = "md" }: { initials: string; size?: "sm" | "md" | "lg" }) {
    const color = getAvatarColor(initials)
    const sz =
        size === "sm" ? "w-8 h-8 text-xs"
        : size === "lg" ? "w-12 h-12 text-base"
        : "w-10 h-10 text-sm"
    return (
        <div className={`${color} ${sz} rounded-full flex items-center justify-center text-white font-bold shrink-0 uppercase`}>
            {initials}
        </div>
    )
}

export function ProgressBar({ value, max, color = "bg-blue-400" }: { value: number; max: number; color?: string }) {
    const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
    return (
        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div className={`${color} h-full rounded-full transition-all`} style={{ width: `${pct}%` }} />
        </div>
    )
}
