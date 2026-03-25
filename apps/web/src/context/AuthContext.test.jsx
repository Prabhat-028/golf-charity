import { useEffect } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "./AuthContext";

const { mockSupabase, unsubscribe } = vi.hoisted(() => {
    const mockSupabase = {
        auth: {
            getSession: vi.fn(),
            onAuthStateChange: vi.fn(),
            signUp: vi.fn(),
            signInWithPassword: vi.fn(),
            signOut: vi.fn(),
            resetPasswordForEmail: vi.fn(),
            updateUser: vi.fn(),
        },
        from: vi.fn(),
    };

    return {
        mockSupabase,
        unsubscribe: vi.fn(),
    };
});

vi.mock("@/lib/supabase", () => ({
    supabase: mockSupabase,
}));

function TestConsumer({ onReady }) {
    const auth = useAuth();

    useEffect(() => {
        onReady?.(auth);
    }, [auth, onReady]);

    return (
        <>
            <div data-testid="loading">{String(auth.loading)}</div>
            <div data-testid="user-id">{auth.user?.id || "none"}</div>
            <div data-testid="role">{auth.profile?.role || "none"}</div>
        </>
    );
}

describe("AuthProvider", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mockSupabase.auth.getSession.mockResolvedValue({
            data: { session: null },
        });

        mockSupabase.auth.onAuthStateChange.mockReturnValue({
            data: {
                subscription: {
                    unsubscribe,
                },
            },
        });

        mockSupabase.from.mockReturnValue({
            select: () => ({
                eq: () => ({
                    single: async () => ({ data: null, error: { message: "not found" } }),
                }),
            }),
        });

        mockSupabase.auth.signInWithPassword.mockResolvedValue({ error: null });
        mockSupabase.auth.signUp.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
        mockSupabase.auth.signOut.mockResolvedValue({ error: null });
        mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null });
        mockSupabase.auth.updateUser.mockResolvedValue({ error: null });
    });

    it("loads anonymous state when no session exists", async () => {
        render(
            <AuthProvider>
                <TestConsumer />
            </AuthProvider>,
        );

        await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
        expect(screen.getByTestId("user-id")).toHaveTextContent("none");
    });

    it("loads user profile from initial authenticated session", async () => {
        mockSupabase.auth.getSession.mockResolvedValue({
            data: {
                session: {
                    user: { id: "user-123" },
                },
            },
        });

        mockSupabase.from.mockReturnValue({
            select: () => ({
                eq: () => ({
                    single: async () => ({
                        data: { id: "user-123", role: "admin" },
                        error: null,
                    }),
                }),
            }),
        });

        render(
            <AuthProvider>
                <TestConsumer />
            </AuthProvider>,
        );

        await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
        expect(screen.getByTestId("user-id")).toHaveTextContent("user-123");
        expect(screen.getByTestId("role")).toHaveTextContent("admin");
    });

    it("exposes auth actions that call supabase methods", async () => {
        let authApi;

        render(
            <AuthProvider>
                <TestConsumer onReady={(value) => (authApi = value)} />
            </AuthProvider>,
        );

        await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));

        await authApi.signIn("test@example.com", "secret");
        expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
            email: "test@example.com",
            password: "secret",
        });

        await authApi.signUp("new@example.com", "secret", "New User");
        expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
            email: "new@example.com",
            password: "secret",
            options: {
                data: { full_name: "New User" },
            },
        });

        await authApi.resetPassword("reset@example.com");
        expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalled();

        await authApi.updatePassword("new-password");
        expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
            password: "new-password",
        });

        await authApi.signOut();
        expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });
});
