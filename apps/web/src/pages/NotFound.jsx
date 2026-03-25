import { Link } from "react-router";
import Button from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

export default function NotFound() {
    return (
        <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
            <Card className="w-full max-w-xl text-center">
                <CardContent className="py-10 space-y-6">
                    <p className="text-sm font-semibold tracking-widest text-primary-600">
                        ERROR 404
                    </p>
                    <h1 className="text-4xl font-bold text-gray-900">
                        Page Not Found
                    </h1>
                    <p className="text-gray-600 max-w-md mx-auto">
                        The page you requested does not exist or may have been moved.
                        Use one of the actions below to continue.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link to="/">
                            <Button>Back to Home</Button>
                        </Link>
                        <Link to="/dashboard">
                            <Button variant="outline">Go to Dashboard</Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
