import Button from "@/components/ui/Button";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function QueryErrorState({
    title = "Unable to load data",
    message = "Please check your connection and try again.",
    onRetry,
}) {
    return (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-3" />
            <p className="text-red-900 font-semibold">{title}</p>
            <p className="text-sm text-red-700 mt-1">{message}</p>
            {onRetry && (
                <div className="mt-4 flex justify-center">
                    <Button variant="outline" onClick={onRetry}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Try Again
                    </Button>
                </div>
            )}
        </div>
    );
}
