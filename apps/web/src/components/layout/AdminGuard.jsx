import { Navigate } from "react-router";
import { useAuth } from "@/context/AuthContext";
import Skeleton from "@/components/ui/Skeleton";

export default function AdminGuard({ children }) {
    const { user, loading, isAdmin } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <div className="w-full max-w-md space-y-4 p-8">
                    <Skeleton className="h-8 w-32 mx-auto bg-gray-700" />
                    <Skeleton className="h-4 w-48 mx-auto bg-gray-700" />
                    <Skeleton className="h-32 w-full bg-gray-700" />
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (!isAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}
