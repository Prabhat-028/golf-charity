import { useState } from "react";
import { Outlet, NavLink, Link } from "react-router";
import { useAuth } from "@/context/AuthContext";
import {
    LayoutDashboard,
    Ticket,
    Users,
    Trophy,
    Heart,
    Shield,
    SlidersHorizontal,
    ArrowLeft,
    Menu,
    X,
    LogOut,
} from "lucide-react";

const adminNavigation = [
    { name: "Overview", href: "/admin", icon: LayoutDashboard, end: true },
    { name: "Draws", href: "/admin/draws", icon: Ticket },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Winners", href: "/admin/winners", icon: Trophy },
    { name: "Charities", href: "/admin/charities", icon: Heart },
    { name: "GDPR", href: "/admin/gdpr", icon: Shield },
    { name: "Settings", href: "/admin/settings", icon: SlidersHorizontal },
];

export default function AdminLayout() {
    const { signOut } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-900">
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside
                className={`fixed top-0 left-0 z-50 h-full w-64 bg-gray-800 border-r border-gray-700 transform transition-transform duration-200 lg:translate-x-0 flex flex-col overflow-hidden ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
            >
                <div className="flex items-center justify-between h-16 px-6 border-b border-gray-700">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                                GC
                            </span>
                        </div>
                        <span className="font-semibold text-white">Admin</span>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-2 text-gray-400 hover:text-white"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
                    {adminNavigation.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.href}
                            end={item.end}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? "bg-gray-700 text-white" : "text-gray-400 hover:bg-gray-700 hover:text-white"}`
                            }
                        >
                            <item.icon className="h-5 w-5" />
                            {item.name}
                        </NavLink>
                    ))}
                </nav>
                <div className="p-4 border-t border-gray-700 space-y-2 mt-auto">
                    <Link
                        to="/dashboard"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-700 hover:text-white"
                    >
                        <ArrowLeft className="h-5 w-5" />
                        Back to App
                    </Link>
                    <button
                        onClick={signOut}
                        className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-900/20"
                    >
                        <LogOut className="h-5 w-5" />
                        Sign out
                    </button>
                </div>
            </aside>

            <div className="lg:pl-64">
                <header className="sticky top-0 z-30 bg-gray-800 border-b border-gray-700">
                    <div className="flex items-center h-16 px-4 sm:px-6 lg:px-8">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 text-gray-400 hover:text-white"
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                        <h1 className="ml-4 lg:ml-0 text-lg font-semibold text-white">
                            Admin Dashboard
                        </h1>
                    </div>
                </header>
                <main className="p-4 sm:p-6 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
