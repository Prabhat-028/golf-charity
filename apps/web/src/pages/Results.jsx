import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/Card";
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
import Skeleton from "@/components/ui/Skeleton";
import QueryErrorState from "@/components/ui/QueryErrorState";
import {
    Trophy,
    Calendar,
    DollarSign,
    Users,
    ChevronRight,
} from "lucide-react";
import { format } from "date-fns";

export default function Results() {
    const { profile } = useAuth();

    const {
        data: draws,
        isLoading,
        isError: drawsError,
        refetch: refetchDraws,
    } = useQuery({
        queryKey: ["draws"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("draws")
                .select("*, winners(count)")
                .eq("status", "completed")
                .order("draw_date", { ascending: false });
            if (error) throw error;
            return data;
        },
    });

    const {
        data: userWins,
        isLoading: userWinsLoading,
        isError: userWinsError,
        refetch: refetchUserWins,
    } = useQuery({
        queryKey: ["user-wins"],
        queryFn: async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) return [];

            const { data, error } = await supabase
                .from("winners")
                .select("draw_id")
                .eq("user_id", user.id);
            if (error) throw error;
            return data.map((w) => w.draw_id);
        },
    });

    useEffect(() => {
        if (!draws?.length || !profile?.id || !profile?.push_results_enabled) {
            return;
        }

        if (typeof Notification === "undefined") return;
        if (Notification.permission !== "granted") return;

        const latest = draws[0];
        if (!latest?.id) return;

        const storageKey = `gc_last_notified_draw_${profile.id}`;
        const lastNotified = window.localStorage.getItem(storageKey);

        if (lastNotified === latest.id) {
            return;
        }

        const drawDate = latest.draw_date
            ? format(new Date(latest.draw_date), "MMMM yyyy")
            : "Latest draw";

        new Notification("New draw results are available", {
            body: `${drawDate} results have been published.`,
        });

        window.localStorage.setItem(storageKey, latest.id);
    }, [draws, profile?.id, profile?.push_results_enabled]);

    if (isLoading || userWinsLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-64" />
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                    </CardHeader>
                    <CardContent>
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-16 mb-2" />
                        ))}
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (drawsError || userWinsError) {
        return (
            <QueryErrorState
                title="Unable to load draw results"
                message="Please check your connection and try loading results again."
                onRetry={() => {
                    refetchDraws();
                    refetchUserWins();
                }}
            />
        );
    }

    const totalPrizePool =
        draws?.reduce(
            (sum, draw) =>
                sum +
                draw.five_match_prize +
                draw.four_match_prize +
                draw.three_match_prize,
            0,
        ) || 0;

    const totalWinners =
        draws?.reduce(
            (sum, draw) => sum + (draw.winners?.[0]?.count || 0),
            0,
        ) || 0;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">
                    Draw Results
                </h1>
                <p className="text-gray-600 mt-1">
                    View all past draws and winning numbers
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary-100 rounded-lg">
                                <Trophy className="h-6 w-6 text-primary-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">
                                    Total Draws
                                </p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {draws?.length || 0}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <DollarSign className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">
                                    Total Prizes
                                </p>
                                <p className="text-2xl font-bold text-gray-900">
                                    ${totalPrizePool.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Users className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">
                                    Total Winners
                                </p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {totalWinners}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Past Draws</CardTitle>
                    <CardDescription>
                        Click on any draw to view details and winners
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!draws || draws.length === 0 ? (
                        <div className="text-center py-12">
                            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg mb-2">
                                No draws completed yet
                            </p>
                            <p className="text-sm text-gray-400">
                                The first draw will happen at the end of this
                                month
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Draw Date</TableHead>
                                        <TableHead>Winning Numbers</TableHead>
                                        <TableHead>Prize Pool</TableHead>
                                        <TableHead>Winners</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {draws.map((draw) => {
                                        const isWinner = userWins?.includes(
                                            draw.id,
                                        );
                                        const totalPrize =
                                            draw.five_match_prize +
                                            draw.four_match_prize +
                                            draw.three_match_prize;

                                        return (
                                            <TableRow
                                                key={draw.id}
                                                className={
                                                    isWinner
                                                        ? "bg-amber-50"
                                                        : ""
                                                }
                                            >
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-gray-400" />
                                                        {format(
                                                            new Date(
                                                                draw.draw_date,
                                                            ),
                                                            "MMM d, yyyy",
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1">
                                                        {draw.numbers.map(
                                                            (num, i) => (
                                                                <div
                                                                    key={i}
                                                                    className="w-8 h-8 rounded bg-gray-900 text-white flex items-center justify-center text-sm font-bold"
                                                                >
                                                                    {num}
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    $
                                                    {totalPrize.toLocaleString()}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="default">
                                                        {draw.winners?.[0]
                                                            ?.count || 0}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {isWinner ? (
                                                        <Badge variant="success">
                                                            You Won!
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="info">
                                                            Completed
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Link
                                                        to={`/results/${draw.id}`}
                                                    >
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                        >
                                                            View
                                                            <ChevronRight className="h-4 w-4 ml-1" />
                                                        </Button>
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
