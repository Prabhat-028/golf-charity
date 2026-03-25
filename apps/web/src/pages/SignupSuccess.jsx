import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { CheckCircle, Loader2 } from "lucide-react";

export default function SignupSuccess() {
    const [searchParams] = useSearchParams();
    const [verifying, setVerifying] = useState(true);
    const [error, setError] = useState("");
    const sessionId = searchParams.get("session_id");

    useEffect(() => {
        async function verifySession() {
            if (!sessionId) {
                setError("No session ID found");
                setVerifying(false);
                return;
            }

            // Wait a moment for webhook to process
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // Check if subscription was created
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                setError("User not found. Please log in.");
                setVerifying(false);
                return;
            }

            const { data: subscription, error: subError } = await supabase
                .from("subscriptions")
                .select("*")
                .eq("user_id", user.id)
                .eq("status", "active")
                .single();

            if (subError || !subscription) {
                // Subscription might still be processing
                console.log(
                    "Subscription not found yet, will be available shortly",
                );
            }

            setVerifying(false);
        }

        verifySession();
    }, [sessionId]);

    if (verifying) {
        return (
            <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
                <Card className="w-full max-w-md text-center">
                    <CardContent className="py-8">
                        <Loader2 className="h-16 w-16 text-primary-600 animate-spin mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Processing your subscription...
                        </h2>
                        <p className="text-gray-600">
                            Please wait while we set up your account.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
                <Card className="w-full max-w-md text-center">
                    <CardContent className="py-8">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">⚠️</span>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Something went wrong
                        </h2>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <Link to="/login">
                            <Button>Go to Login</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
            <Card className="w-full max-w-md text-center">
                <CardContent className="py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Welcome to Golf Charity!
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Your subscription is active. Check your email for a
                        confirmation and verification link.
                    </p>
                    <div className="space-y-3">
                        <Link to="/dashboard">
                            <Button className="w-full">Go to Dashboard</Button>
                        </Link>
                        <p className="text-sm text-gray-500">
                            Start entering your golf scores to participate in
                            the next draw!
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
