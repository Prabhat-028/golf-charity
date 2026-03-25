import { Navigate, useLocation } from "react-router";
import { useAuth } from "@/context/AuthContext";
import Skeleton from "@/components/ui/Skeleton";

export default function AuthGuard({ children }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-full max-w-md space-y-4 p-8">
                    <Skeleton className="h-8 w-32 mx-auto" />
                    <Skeleton className="h-4 w-48 mx-auto" />
                    <Skeleton className="h-32 w-full" />
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
}
