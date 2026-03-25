import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export default function TermsOfService() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-10">
            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl">Terms of Service</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 text-gray-700 leading-relaxed">
                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            1. Acceptance of Terms
                        </h2>
                        <p>
                            By using Golf Charity, you agree to these terms and all
                            applicable laws. If you do not agree, do not use the platform.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            2. Eligibility
                        </h2>
                        <p>
                            You must be legally allowed to participate in paid promotions
                            in your jurisdiction. You are responsible for local compliance.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            3. Subscriptions and Billing
                        </h2>
                        <p>
                            Subscriptions renew automatically unless canceled. Billing,
                            upgrades, and cancellations are processed via Stripe.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            4. Draw Participation
                        </h2>
                        <p>
                            Draw eligibility requires valid score submissions and an active
                            subscription. Draw outcomes are based on the platform rules.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            5. Account Security
                        </h2>
                        <p>
                            You are responsible for account credentials and all activity
                            under your account. Report unauthorized access immediately.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            6. Contact
                        </h2>
                        <p>
                            For terms questions, contact support@golfcharity.com.
                        </p>
                    </section>
                </CardContent>
            </Card>
        </div>
    );
}
