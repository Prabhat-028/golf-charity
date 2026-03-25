import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export default function NetworkStatusBanner() {
    const [isOnline, setIsOnline] = useState(() =>
        typeof navigator === "undefined" ? true : navigator.onLine,
    );

    useEffect(() => {
        function handleOnline() {
            setIsOnline(true);
        }

        function handleOffline() {
            setIsOnline(false);
        }

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    if (isOnline) {
        return null;
    }

    return (
        <div className="fixed top-0 inset-x-0 z-70 bg-amber-500 text-black shadow-md">
            <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium">
                <WifiOff className="h-4 w-4" />
                You are offline. Some features may be unavailable until your connection is restored.
            </div>
        </div>
    );
}
