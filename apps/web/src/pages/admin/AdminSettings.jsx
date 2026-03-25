import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/context/ToastContext";

export default function AdminSettings() {
    const queryClient = useQueryClient();
    const { addToast } = useToast();

    const { data: settings, isLoading } = useQuery({
        queryKey: ["admin-platform-settings"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("platform_settings")
                .select("*")
                .eq("id", "default")
                .single();

            if (error) throw error;
            return data;
        },
    });

    const [form, setForm] = useState({
        five_match_pct: "40",
        four_match_pct: "35",
        three_match_pct: "25",
        charity_pct: "10",
    });

    const saveMutation = useMutation({
        mutationFn: async (payload) => {
            const { error } = await supabase
                .from("platform_settings")
                .update(payload)
                .eq("id", "default");

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-platform-settings"] });
            addToast("Platform settings saved", "success");
        },
        onError: () => addToast("Failed to save settings", "error"),
    });

    function syncFromSettings() {
        if (!settings) return;
        setForm({
            five_match_pct: String(settings.five_match_pct),
            four_match_pct: String(settings.four_match_pct),
            three_match_pct: String(settings.three_match_pct),
            charity_pct: String(settings.charity_pct),
        });
    }

    if (!isLoading && settings && form.five_match_pct === "40" && form.four_match_pct === "35" && form.three_match_pct === "25" && form.charity_pct === "10") {
        syncFromSettings();
    }

    function handleSubmit(event) {
        event.preventDefault();

        const five = Number(form.five_match_pct || 0);
        const four = Number(form.four_match_pct || 0);
        const three = Number(form.three_match_pct || 0);
        const charity = Number(form.charity_pct || 0);

        if ([five, four, three, charity].some((n) => Number.isNaN(n) || n < 0)) {
            addToast("All percentages must be non-negative numbers", "error");
            return;
        }

        const prizeTotal = five + four + three;
        if (prizeTotal !== 100) {
            addToast("Prize tier percentages must total 100%", "error");
            return;
        }

        if (charity > 100) {
            addToast("Charity percentage must be 100 or less", "error");
            return;
        }

        saveMutation.mutate({
            five_match_pct: five,
            four_match_pct: four,
            three_match_pct: three,
            charity_pct: charity,
            updated_at: new Date().toISOString(),
        });
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Platform Settings</h1>
                <p className="text-gray-400 mt-1">
                    Configure draw percentages used for prize and charity calculations.
                </p>
            </div>

            <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                    <CardTitle className="text-white">Prize Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <Skeleton className="h-56 bg-gray-700" />
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                label="Five Match Prize %"
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={form.five_match_pct}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        five_match_pct: e.target.value,
                                    }))
                                }
                            />
                            <Input
                                label="Four Match Prize %"
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={form.four_match_pct}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        four_match_pct: e.target.value,
                                    }))
                                }
                            />
                            <Input
                                label="Three Match Prize %"
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={form.three_match_pct}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        three_match_pct: e.target.value,
                                    }))
                                }
                            />
                            <Input
                                label="Charity Share %"
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={form.charity_pct}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        charity_pct: e.target.value,
                                    }))
                                }
                                helperText="Prize percentages must total 100%. Charity share controls the reserved donation portion."
                            />

                            <div className="flex justify-end pt-2">
                                <Button type="submit" loading={saveMutation.isPending}>
                                    Save Settings
                                </Button>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
