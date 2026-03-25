import { Component } from "react";
import { Link } from "react-router";
import Button from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, info) {
        console.error("Unhandled application error", error, info);
    }

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
                    <Card className="w-full max-w-xl text-center">
                        <CardContent className="py-10 space-y-6">
                            <p className="text-sm font-semibold tracking-widest text-red-600">
                                APPLICATION ERROR
                            </p>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Something went wrong
                            </h1>
                            <p className="text-gray-600 max-w-md mx-auto">
                                An unexpected error occurred. You can reload the
                                app or return to the home page.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <Button onClick={this.handleReload}>Reload App</Button>
                                <Link to="/">
                                    <Button variant="outline">Go Home</Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}