import { useState } from "react";
import { Outlet, NavLink, Link } from "react-router";
import { useAuth } from "@/context/AuthContext";
import {
    LayoutDashboard,
    Target,
    Trophy,
    Medal,
    Heart,
    Settings,
    LogOut,
    Menu,
    X,
    ChevronDown,
} from "lucide-react";
import Avatar from "@/components/ui/Avatar";

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "My Scores", href: "/scores", icon: Target },
    { name: "Results", href: "/results", icon: Trophy },
    { name: "Win History", href: "/wins", icon: Medal },
    { name: "Charities", href: "/charities", icon: Heart },
];

export default function AppLayout() {
    const { profile, signOut, isAdmin } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50">
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-60 bg-white text-primary-700 border border-primary-300 rounded px-3 py-2"
            >
                Skip to main content
            </a>
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}

            <aside
                className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 lg:translate-x-0 flex flex-col overflow-hidden ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
            >
                <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
                    <Link to="/dashboard" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                                GC
                            </span>
                        </div>
                        <span className="font-semibold text-gray-900">
                            Golf Charity
                        </span>
                    </Link>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-2 text-gray-500 hover:text-gray-700"
                        aria-label="Close navigation menu"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <nav
                    className="p-4 space-y-1 flex-1 overflow-y-auto"
                    aria-label="Main navigation"
                >
                    {navigation.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.href}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? "bg-primary-50 text-primary-700" : "text-gray-600 hover:bg-gray-100"}`
                            }
                        >
                            <item.icon className="h-5 w-5" />
                            {item.name}
                        </NavLink>
                    ))}
                </nav>
                {isAdmin && (
                    <div className="px-4 pb-20 lg:pb-4 mt-auto">
                        <Link
                            to="/admin"
                            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium bg-gray-900 text-white hover:bg-gray-800"
                        >
                            <Settings className="h-5 w-5" />
                            Admin Panel
                        </Link>
                    </div>
                )}
            </aside>

            <div className="lg:pl-64">
                <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
                    <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 text-gray-500 hover:text-gray-700"
                            aria-label="Open navigation menu"
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                        <div className="flex-1" />
                        <div className="relative">
                            <button
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100"
                                aria-haspopup="menu"
                                aria-expanded={userMenuOpen}
                                aria-controls="user-menu"
                                aria-label="Open user menu"
                            >
                                <Avatar
                                    src={profile?.avatar_url}
                                    alt={profile?.full_name || ""}
                                    size="sm"
                                />
                                <span className="hidden sm:block text-sm font-medium text-gray-700">
                                    {profile?.full_name || "User"}
                                </span>
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                            </button>
                            {userMenuOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setUserMenuOpen(false)}
                                        aria-hidden="true"
                                    />
                                    <div
                                        id="user-menu"
                                        role="menu"
                                        aria-label="User menu"
                                        className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20"
                                    >
                                        <Link
                                            to="/account"
                                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            role="menuitem"
                                            onClick={() =>
                                                setUserMenuOpen(false)
                                            }
                                        >
                                            <Settings className="h-4 w-4" />
                                            Account Settings
                                        </Link>
                                        <button
                                            onClick={() => {
                                                setUserMenuOpen(false);
                                                signOut();
                                            }}
                                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                            role="menuitem"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            Sign out
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>
                <main id="main-content" className="p-4 sm:p-6 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
