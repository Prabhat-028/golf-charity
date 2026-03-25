import { loadStripe } from "@stripe/stripe-js";
import { supabase } from "@/lib/supabase";

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let stripePromise = null;

export function getStripe() {
    if (!stripePromise && stripePublishableKey) {
        stripePromise = loadStripe(stripePublishableKey);
    }
    return stripePromise;
}

export const SUBSCRIPTION_PRICES = {
    monthly: import.meta.env.VITE_STRIPE_MONTHLY_PRICE_ID || "",
    yearly: import.meta.env.VITE_STRIPE_YEARLY_PRICE_ID || "",
};

async function callEdgeFunction(functionName, payload) {
    if (!supabaseUrl) {
        throw new Error("Missing Supabase URL");
    }

    const {
        data: { session },
    } = await supabase.auth.getSession();

    const headers = {
        "Content-Type": "application/json",
    };

    if (supabaseAnonKey) {
        headers.apikey = supabaseAnonKey;
    }

    if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
    } else if (supabaseAnonKey) {
        headers.Authorization = `Bearer ${supabaseAnonKey}`;
    }

    const response = await fetch(
        `${supabaseUrl}/functions/v1/${functionName}`,
        {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
        },
    );

    const responseBody = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(responseBody.error || "Request failed");
    }

    return responseBody;
}

export async function createCheckoutSession({ priceId, userId, email }) {
    if (!priceId || !userId || !email) {
        throw new Error("Missing required checkout parameters");
    }

    return callEdgeFunction("create-checkout-session", {
        priceId,
        userId,
        email,
    });
}

export async function createPortalSession({ customerId, returnUrl } = {}) {
    return callEdgeFunction("create-portal-session", {
        customerId,
        returnUrl,
    });
}
