import { useState } from "react";
import { Link } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import { SUBSCRIPTION_PRICES, createCheckoutSession } from "@/lib/stripe";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

const signupSchema = z
    .object({
        fullName: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Please enter a valid email"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        confirmPassword: z.string(),
        plan: z.enum(["monthly", "yearly"]),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
    });

const plans = [
    { id: "monthly", name: "Monthly", price: "$9.99", interval: "month" },
    {
        id: "yearly",
        name: "Yearly",
        price: "$99",
        interval: "year",
        popular: true,
    },
];

export default function Signup() {
    const { signUp } = useAuth();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(signupSchema),
        defaultValues: { plan: "yearly" },
    });

    const selectedPlan = watch("plan");

    async function onSubmit(data) {
        setError("");
        setLoading(true);

        try {
            // Step 1: Create auth account
            const { data: signUpData, error: authError } = await signUp(
                data.email,
                data.password,
                data.fullName,
            );

            if (authError) {
                throw new Error(authError.message);
            }

            // Step 2: Get user ID from sign-up response
            const userId = signUpData?.user?.id;
            const email = signUpData?.user?.email || data.email;

            if (!userId) {
                throw new Error("Failed to get user ID after sign up");
            }

            // Step 3: Create Stripe checkout session
            const priceId = SUBSCRIPTION_PRICES[data.plan];

            if (!priceId) {
                throw new Error("Invalid subscription plan selected");
            }

            const {
                url,
                error: checkoutError,
            } = await createCheckoutSession({
                priceId,
                userId,
                email,
            });

            if (checkoutError) {
                throw new Error(checkoutError);
            }

            // Step 4: Redirect to Stripe Checkout
            if (url) {
                window.location.href = url;
            } else {
                throw new Error("No checkout URL returned");
            }
        } catch (err) {
            setError(err.message || "An error occurred during signup");
            setLoading(false);
        }
    }

    return (
        <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
            <Card className="w-full max-w-lg">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">
                        Create your account
                    </CardTitle>
                    <CardDescription>
                        Start playing for prizes and supporting charities
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="space-y-6"
                    >
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Select your plan
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                {plans.map((plan) => (
                                    <button
                                        key={plan.id}
                                        type="button"
                                        onClick={() =>
                                            setValue("plan", plan.id)
                                        }
                                        className={`relative p-4 rounded-lg border-2 text-left transition-colors ${
                                            selectedPlan === plan.id
                                                ? "border-primary-500 bg-primary-50"
                                                : "border-gray-200 hover:border-gray-300"
                                        }`}
                                    >
                                        {plan.popular && (
                                            <span className="absolute -top-2 right-2 bg-primary-500 text-white text-xs px-2 py-0.5 rounded-full">
                                                Popular
                                            </span>
                                        )}
                                        <div className="font-semibold text-gray-900">
                                            {plan.name}
                                        </div>
                                        <div className="text-lg font-bold text-gray-900">
                                            {plan.price}
                                            <span className="text-sm font-normal text-gray-500">
                                                /{plan.interval}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <Input
                            label="Full Name"
                            placeholder="John Doe"
                            error={errors.fullName?.message}
                            {...register("fullName")}
                        />
                        <Input
                            label="Email"
                            type="email"
                            placeholder="you@example.com"
                            error={errors.email?.message}
                            {...register("email")}
                        />
                        <Input
                            label="Password"
                            type="password"
                            placeholder="Create a password"
                            helperText="Must be at least 8 characters"
                            error={errors.password?.message}
                            {...register("password")}
                        />
                        <Input
                            label="Confirm Password"
                            type="password"
                            placeholder="Confirm your password"
                            error={errors.confirmPassword?.message}
                            {...register("confirmPassword")}
                        />

                        <Button
                            type="submit"
                            className="w-full"
                            loading={loading}
                        >
                            Continue to Payment
                        </Button>
                    </form>
                    <div className="mt-6 text-center text-sm text-gray-600">
                        Already have an account?{" "}
                        <Link
                            to="/login"
                            className="text-primary-600 hover:text-primary-700 font-medium"
                        >
                            Sign in
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
