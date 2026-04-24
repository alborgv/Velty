import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  MdOutlineDashboard,
  MdOutlineHandshake,
  MdOutlinePeople,
  MdOutlineSettings,
  MdOutlineMenu,
  MdOutlineClose,
  MdOutlineSearch,
  MdOutlineCalendarToday,
  MdLogout,
} from "react-icons/md";
import { HiOutlineCurrencyDollar } from "react-icons/hi2";
import { Toaster } from "react-hot-toast";

const navItems = [
  { label: "Dashboard", icon: MdOutlineDashboard, path: "/" },
  { label: "Préstamos", icon: MdOutlineHandshake, path: "/prestamos" },
  { label: "Clientes", icon: MdOutlinePeople, path: "/clientes" },
  { label: "Configuración", icon: MdOutlineSettings, path: "/configuracion" },
];

function useLiveClock() {
  const format = (d: Date) => {
    const hh = d.getHours().toString().padStart(2, "0");
    const mm = d.getMinutes().toString().padStart(2, "0");
    const dd = d.getDate().toString().padStart(2, "0");
    const mo = (d.getMonth() + 1).toString().padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${hh}:${mm} - ${dd}/${mo}/${yyyy}`;
  };

  const [clock, setClock] = useState(() => format(new Date()));

  useEffect(() => {
    const tick = () => setClock(format(new Date()));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  return clock;
}

export const DashboardLayout = () => {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const clock = useLiveClock();

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && search.trim() !== "") {
      navigate(`/clientes?search=${encodeURIComponent(search.trim())}`);
      setSearch("");
    }
  };

  const currentDate = new Date().toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const titleMap: Record<string, string> = {
    "/": "Dashboard",
    "/prestamos": "Préstamos",
    "/clientes": "Clientes",
    "/configuracion": "Configuración",
  };

  const currentTitle = titleMap[location.pathname] || "Velty";

  return (
    <div className="flex h-screen bg-[#f8f9fb] font-[Space_Grotesk,sans-serif] overflow-hidden">
      <Toaster
        position="top-right"
        toastOptions={{ style: { borderRadius: "12px", fontSize: "14px" } }}
      />

      {/* ── Sidebar overlay (mobile) ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`
                    fixed lg:static z-30 h-full w-64 bg-[#1a1f2e] flex flex-col
                    transition-transform duration-300 ease-in-out
                    ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
                `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-white/[0.06]">
          <div className="w-9 h-9 rounded-xl bg-[#3b82f6]/20 flex items-center justify-center">
            <HiOutlineCurrencyDollar className="text-blue-400" size={22} />
          </div>
          <span className="text-white/90 text-lg font-bold tracking-tight">
            Velty
          </span>
          <button
            className="ml-auto lg:hidden text-white/40 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <MdOutlineClose size={22} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.label}
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
                className={`
                                    w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                                    ${
                                      active
                                        ? "bg-white/[0.08] text-white"
                                        : "text-white/40 hover:bg-white/[0.04] hover:text-white/70"
                                    }
                                `}
              >
                <item.icon size={20} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User card / Logout */}
        <div className="px-4 pb-6">
          <div className="bg-white/[0.04] rounded-xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-[#3b82f6]/20 flex items-center justify-center text-blue-400 text-xs font-bold shrink-0">
                {user?.username?.substring(0, 2).toUpperCase() || "U"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white/80 text-sm font-semibold truncate">
                  {user?.username || "Usuario"}
                </p>
                <p className="text-white/30 text-xs mt-0.5 font-mono">
                  {clock}
                </p>
              </div>
            </div>
            <button
              onClick={logoutUser}
              className="text-white/30 hover:text-red-400 p-1 rounded-md transition-colors"
              title="Cerrar sesión"
            >
              <MdLogout size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4 shrink-0">
          <button
            className="lg:hidden text-gray-400 hover:text-gray-600"
            onClick={() => setSidebarOpen(true)}
          >
            <MdOutlineMenu size={24} />
          </button>

          <div>
            <h1 className="text-lg font-bold text-gray-800">{currentTitle}</h1>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <MdOutlineCalendarToday size={12} />
              {currentDate}
            </p>
          </div>

          <div className="ml-auto flex items-center gap-3 flex-1 sm:flex-initial justify-end">
            {/* Search */}
            <div className="hidden sm:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 w-full max-w-xs">
              <MdOutlineSearch className="text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Buscar cliente... (Enter)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearch}
                className="bg-transparent text-sm text-gray-600 outline-none w-full placeholder:text-gray-400"
              />
            </div>
          </div>
        </header>

        {/* Scrollable body */}
        <main className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
