import { Link } from "react-router";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { XCircle } from "lucide-react";

export default function SignupCancel() {
    return (
        <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
            <Card className="w-full max-w-md text-center">
                <CardContent className="py-8">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <XCircle className="h-8 w-8 text-yellow-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Subscription Cancelled
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Your payment was cancelled. No charges were made to your
                        account.
                    </p>
                    <div className="space-y-3">
                        <Link to="/signup">
                            <Button className="w-full">Try Again</Button>
                        </Link>
                        <Link to="/">
                            <Button variant="outline" className="w-full">
                                Back to Home
                            </Button>
                        </Link>
                    </div>
                    <p className="mt-6 text-sm text-gray-500">
                        Questions? Contact us at support@golfcharity.com
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
