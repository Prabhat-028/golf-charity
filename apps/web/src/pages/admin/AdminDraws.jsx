import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { downloadCsv } from "@/lib/csv";
import { calculateDrawAmounts, generateDrawNumbers } from "@/lib/draw";
import { buildMonthlyDrawPayload, formatDrawsForExport } from "@/lib/adminDraws";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "@/components/ui/Table";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/context/ToastContext";
import { format } from "date-fns";
import { Download, Plus, Play } from "lucide-react";

export default function AdminDraws() {
    const queryClient = useQueryClient();
    const { addToast } = useToast();
    const [showModal, setShowModal] = useState(false);

    const { data: draws, isLoading } = useQuery({
        queryKey: ["admin-draws"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("draws")
                .select("*")
                .order("draw_date", { ascending: false });
            if (error) throw error;
            return data;
        },
    });

    const executeMutation = useMutation({
        mutationFn: async (drawId) => {
            const numbers = generateDrawNumbers();

            // Get prize pool (simplified - count active subscribers)
            const { count } = await supabase
                .from("subscriptions")
                .select("id", { count: "exact" })
                .eq("status", "active");

            // Read configurable percentages from platform settings
            const { data: settings } = await supabase
                .from("platform_settings")
                .select("five_match_pct, four_match_pct, three_match_pct, charity_pct")
                .eq("id", "default")
                .single();

            const fivePct = Number(settings?.five_match_pct ?? 40);
            const fourPct = Number(settings?.four_match_pct ?? 35);
            const threePct = Number(settings?.three_match_pct ?? 25);
            const charityPct = Number(settings?.charity_pct ?? 10);

            const amounts = calculateDrawAmounts(count, {
                five_match_pct: fivePct,
                four_match_pct: fourPct,
                three_match_pct: threePct,
                charity_pct: charityPct,
            });

            const { error } = await supabase
                .from("draws")
                .update({
                    numbers,
                    prize_pool: amounts.prizePool,
                    five_match_prize: amounts.fiveMatchPrize,
                    four_match_prize: amounts.fourMatchPrize,
                    three_match_prize: amounts.threeMatchPrize,
                    charity_amount: amounts.charityAmount,
                    status: "completed",
                })
                .eq("id", drawId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-draws"] });
            addToast("Draw executed successfully!", "success");
        },
        onError: () => addToast("Failed to execute draw", "error"),
    });

    const createMutation = useMutation({
        mutationFn: async () => {
            const { error } = await supabase
                .from("draws")
                .insert(buildMonthlyDrawPayload());
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-draws"] });
            setShowModal(false);
            addToast("Draw created!", "success");
        },
        onError: () => addToast("Failed to create draw", "error"),
    });

    function handleExportDraws() {
        const rows = formatDrawsForExport(draws || []);

        downloadCsv("admin-draws.csv", rows);
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">
                        Draw Management
                    </h1>
                    <p className="text-gray-400 mt-1">
                        Create and execute monthly draws
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={handleExportDraws}
                        disabled={!draws?.length}
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                    </Button>
                    <Button onClick={() => setShowModal(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Draw
                    </Button>
                </div>
            </div>

            <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                    <CardTitle className="text-white">All Draws</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-6">
                            <Skeleton className="h-48 bg-gray-700" />
                        </div>
                    ) : !draws?.length ? (
                        <div className="p-10 text-center">
                            <p className="text-white text-lg font-medium">
                                No draws available yet
                            </p>
                            <p className="text-gray-400 mt-2">
                                Create your first draw to start monthly execution.
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-gray-700">
                                <TableRow className="border-gray-600 hover:bg-gray-700">
                                    <TableHead className="text-gray-300">
                                        Date
                                    </TableHead>
                                    <TableHead className="text-gray-300">
                                        Numbers
                                    </TableHead>
                                    <TableHead className="text-gray-300">
                                        Prize Pool
                                    </TableHead>
                                    <TableHead className="text-gray-300">
                                        Charity
                                    </TableHead>
                                    <TableHead className="text-gray-300">
                                        Status
                                    </TableHead>
                                    <TableHead className="text-gray-300">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {draws?.map((draw) => (
                                    <TableRow
                                        key={draw.id}
                                        className="border-gray-600 hover:bg-gray-700"
                                    >
                                        <TableCell className="text-white">
                                            {format(
                                                new Date(draw.draw_date),
                                                "MMM yyyy",
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                {draw.numbers.length ? (
                                                    draw.numbers.map((n, i) => (
                                                        <span
                                                            key={i}
                                                            className="w-7 h-7 rounded-full bg-gray-600 text-white text-xs flex items-center justify-center font-bold"
                                                        >
                                                            {n}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-gray-500">
                                                        -
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-white">
                                            ${draw.prize_pool.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-pink-400">
                                            $
                                            {draw.charity_amount.toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    draw.status === "completed"
                                                        ? "success"
                                                        : "warning"
                                                }
                                            >
                                                {draw.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {draw.status === "pending" && (
                                                <Button
                                                    size="sm"
                                                    onClick={() =>
                                                        executeMutation.mutate(
                                                            draw.id,
                                                        )
                                                    }
                                                    loading={
                                                        executeMutation.isPending
                                                    }
                                                >
                                                    <Play className="h-3 w-3 mr-1" />
                                                    Execute
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Create New Draw"
            >
                <div className="space-y-4">
                    <p className="text-gray-600">
                        Create a new pending draw for the end of this month?
                    </p>
                    <div className="flex gap-3 justify-end">
                        <Button
                            variant="outline"
                            onClick={() => setShowModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => createMutation.mutate()}
                            loading={createMutation.isPending}
                        >
                            Create Draw
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
