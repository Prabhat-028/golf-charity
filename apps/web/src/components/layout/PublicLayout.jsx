import { Outlet, Link } from "react-router";

export default function PublicLayout() {
    return (
        <div className="min-h-screen flex flex-col">
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16 gap-3">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">
                                    GC
                                </span>
                            </div>
                            <span className="font-semibold text-gray-900">
                                Golf Charity
                            </span>
                        </Link>
                        <nav
                            className="flex items-center gap-2 sm:gap-4"
                            aria-label="Public navigation"
                        >
                            <Link
                                to="/login"
                                className="text-sm font-medium text-gray-600 hover:text-gray-900 whitespace-nowrap"
                            >
                                Log in
                            </Link>
                            <Link
                                to="/signup"
                                className="text-sm font-medium bg-primary-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-primary-700 whitespace-nowrap"
                            >
                                Get Started
                            </Link>
                        </nav>
                    </div>
                </div>
            </header>
            <main className="flex-1" id="main-content">
                <Outlet />
            </main>
            <footer className="bg-gray-900 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">
                                        GC
                                    </span>
                                </div>
                                <span className="font-semibold">
                                    Golf Charity
                                </span>
                            </div>
                            <p className="text-gray-400 text-sm">
                                Win prizes while supporting charities through
                                golf.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Product</h4>
                            <ul className="space-y-2 text-gray-400 text-sm">
                                <li>
                                    <Link
                                        to="/signup"
                                        className="hover:text-white"
                                    >
                                        Subscribe
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/" className="hover:text-white">
                                        How it works
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/" className="hover:text-white">
                                        Pricing
                                    </Link>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Company</h4>
                            <ul className="space-y-2 text-gray-400 text-sm">
                                <li>
                                    <Link to="/" className="hover:text-white">
                                        About
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/" className="hover:text-white">
                                        Contact
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/" className="hover:text-white">
                                        Charities
                                    </Link>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Legal</h4>
                            <ul className="space-y-2 text-gray-400 text-sm">
                                <li>
                                    <Link
                                        to="/privacy"
                                        className="hover:text-white"
                                    >
                                        Privacy
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/terms"
                                        className="hover:text-white"
                                    >
                                        Terms
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
                        &copy; {new Date().getFullYear()} Golf Charity. All
                        rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}
