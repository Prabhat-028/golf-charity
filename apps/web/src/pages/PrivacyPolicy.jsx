import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export default function PrivacyPolicy() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-10">
            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl">Privacy Policy</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 text-gray-700 leading-relaxed">
                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            1. Information We Collect
                        </h2>
                        <p>
                            We collect account details, subscription metadata, score
                            submissions, and limited usage data needed to operate the
                            platform.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            2. How We Use Information
                        </h2>
                        <p>
                            Data is used to provide access, manage subscriptions, run draws,
                            improve platform quality, and communicate service updates.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            3. Payments
                        </h2>
                        <p>
                            Payment processing is handled by Stripe. We do not store full
                            card details on our servers.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            4. Data Sharing
                        </h2>
                        <p>
                            We share data only with service providers needed to operate the
                            platform and where required by law.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            5. Data Rights
                        </h2>
                        <p>
                            You may request access, correction, or deletion of your personal
                            data by contacting support@golfcharity.com.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            6. Contact
                        </h2>
                        <p>
                            For privacy questions, contact support@golfcharity.com.
                        </p>
                    </section>
                </CardContent>
            </Card>
        </div>
    );
}
