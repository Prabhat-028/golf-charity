import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router";
import Skeleton from "@/components/ui/Skeleton";

// Layouts
import PublicLayout from "@/components/layout/PublicLayout";
import AppLayout from "@/components/layout/AppLayout";
import AdminLayout from "@/components/layout/AdminLayout";

// Public pages
const Landing = lazy(() => import("@/pages/Landing"));
const Login = lazy(() => import("@/pages/Login"));
const Signup = lazy(() => import("@/pages/Signup"));
const SignupSuccess = lazy(() => import("@/pages/SignupSuccess"));
const SignupCancel = lazy(() => import("@/pages/SignupCancel"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const TermsOfService = lazy(() => import("@/pages/TermsOfService"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const NotFound = lazy(() => import("@/pages/NotFound"));

// Protected pages
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Scores = lazy(() => import("@/pages/Scores"));
const Results = lazy(() => import("@/pages/Results"));
const ResultDetail = lazy(() => import("@/pages/ResultDetail"));
const WinHistory = lazy(() => import("@/pages/WinHistory"));
const Charities = lazy(() => import("@/pages/Charities"));
const Account = lazy(() => import("@/pages/Account"));

// Admin pages
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminDraws = lazy(() => import("@/pages/admin/AdminDraws"));
const AdminUsers = lazy(() => import("@/pages/admin/AdminUsers"));
const AdminWinners = lazy(() => import("@/pages/admin/AdminWinners"));
const AdminCharities = lazy(() => import("@/pages/admin/AdminCharities"));
const AdminGdprRequests = lazy(() => import("@/pages/admin/AdminGdprRequests"));
const AdminSettings = lazy(() => import("@/pages/admin/AdminSettings"));

// Guards
import AuthGuard from "@/components/layout/AuthGuard";
import AdminGuard from "@/components/layout/AdminGuard";

function RouteLoadingFallback() {
    return (
        <div className="max-w-5xl mx-auto p-6 space-y-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
        </div>
    );
}

export default function App() {
    return (
        <Suspense fallback={<RouteLoadingFallback />}>
            <Routes>
                {/* Public routes */}
                <Route element={<PublicLayout />}>
                    <Route index element={<Landing />} />
                    <Route path="login" element={<Login />} />
                    <Route path="signup" element={<Signup />} />
                    <Route
                        path="signup/success"
                        element={<SignupSuccess />}
                    />
                    <Route path="signup/cancel" element={<SignupCancel />} />
                    <Route
                        path="forgot-password"
                        element={<ForgotPassword />}
                    />
                    <Route path="reset-password" element={<ResetPassword />} />
                    <Route path="terms" element={<TermsOfService />} />
                    <Route path="privacy" element={<PrivacyPolicy />} />
                </Route>

                {/* Protected user routes */}
                <Route
                    element={
                        <AuthGuard>
                            <AppLayout />
                        </AuthGuard>
                    }
                >
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="scores" element={<Scores />} />
                    <Route path="results" element={<Results />} />
                    <Route path="results/:id" element={<ResultDetail />} />
                    <Route path="wins" element={<WinHistory />} />
                    <Route path="charities" element={<Charities />} />
                    <Route path="account" element={<Account />} />
                </Route>

                {/* Admin routes */}
                <Route
                    path="admin"
                    element={
                        <AdminGuard>
                            <AdminLayout />
                        </AdminGuard>
                    }
                >
                    <Route index element={<AdminDashboard />} />
                    <Route path="draws" element={<AdminDraws />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="winners" element={<AdminWinners />} />
                    <Route path="charities" element={<AdminCharities />} />
                    <Route path="gdpr" element={<AdminGdprRequests />} />
                    <Route path="settings" element={<AdminSettings />} />
                </Route>

                <Route path="*" element={<NotFound />} />
            </Routes>
        </Suspense>
    );
}
