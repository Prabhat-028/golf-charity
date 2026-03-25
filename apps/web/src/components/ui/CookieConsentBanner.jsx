import { useEffect, useState } from "react";
import { Link } from "react-router";
import Button from "@/components/ui/Button";

const COOKIE_CONSENT_KEY = "gc_cookie_consent";

export default function CookieConsentBanner() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const savedChoice = window.localStorage.getItem(COOKIE_CONSENT_KEY);
        if (!savedChoice) {
            setVisible(true);
        }
    }, []);

    function saveChoice(value) {
        window.localStorage.setItem(COOKIE_CONSENT_KEY, value);
        setVisible(false);
    }

    if (!visible) return null;

    return (
        <div
            className="fixed bottom-4 left-4 right-4 z-50 md:left-6 md:right-6"
            role="region"
            aria-label="Cookie consent banner"
        >
            <div className="max-w-5xl mx-auto rounded-xl border border-gray-200 bg-white shadow-xl p-4 md:p-5">
                <div className="flex flex-col md:flex-row md:items-center gap-4 md:justify-between">
                    <div className="text-sm text-gray-700">
                        <p className="font-semibold text-gray-900 mb-1">
                            We use cookies
                        </p>
                        <p>
                            We use essential cookies to keep the platform secure and
                            optional cookies to improve analytics and experience. See our{" "}
                            <Link to="/privacy" className="text-primary-700 underline">
                                Privacy Policy
                            </Link>{" "}
                            and{" "}
                            <Link to="/terms" className="text-primary-700 underline">
                                Terms of Service
                            </Link>
                            .
                        </p>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <Button
                            variant="outline"
                            onClick={() => saveChoice("declined")}
                        >
                            Decline Optional
                        </Button>
                        <Button onClick={() => saveChoice("accepted")}>
                            Accept All
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
