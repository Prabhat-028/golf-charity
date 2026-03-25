import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { supabase } from "@/lib/supabase";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "@/components/ui/Table";
import Skeleton from "@/components/ui/Skeleton";
import { format } from "date-fns";
import { Calendar, DollarSign, Trophy } from "lucide-react";

export default function WinHistory() {
    const { data: wins, isLoading } = useQuery({
        queryKey: ["win-history"],
        queryFn: async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) return [];

            const { data, error } = await supabase
                .from("winners")
                .select("id, draw_id, matches, prize_amount, payout_status, created_at, draw:draws(draw_date)")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data;
        },
    });

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-52 w-full" />
            </div>
        );
    }

    const totalWins = wins?.length || 0;
    const totalPrizeMoney =
        wins?.reduce((sum, win) => sum + Number(win.prize_amount || 0), 0) || 0;
    const paidWins = wins?.filter((win) => win.payout_status === "paid").length || 0;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Win History</h1>
                <p className="text-gray-600 mt-1">
                    Review your past wins and payout status.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-amber-100 rounded-lg">
                                <Trophy className="h-6 w-6 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Total Wins</p>
                                <p className="text-2xl font-bold text-gray-900">{totalWins}</p>
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
                                <p className="text-sm text-gray-600">Total Prize Money</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    ${totalPrizeMoney.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Calendar className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Paid Out</p>
                                <p className="text-2xl font-bold text-gray-900">{paidWins}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Your Winning Draws</CardTitle>
                    <CardDescription>
                        Detailed list of draws where you matched 3 or more numbers.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!wins?.length ? (
                        <div className="text-center py-12">
                            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg mb-2">No wins yet</p>
                            <p className="text-sm text-gray-400 mb-4">
                                Keep submitting scores to improve your chances in upcoming draws.
                            </p>
                            <Link to="/scores">
                                <Button>Enter Scores</Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Draw Date</TableHead>
                                        <TableHead>Matches</TableHead>
                                        <TableHead>Prize</TableHead>
                                        <TableHead>Payout Status</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {wins.map((win) => (
                                        <TableRow key={win.id}>
                                            <TableCell>
                                                {win.draw?.draw_date
                                                    ? format(
                                                          new Date(win.draw.draw_date),
                                                          "MMM d, yyyy",
                                                      )
                                                    : "-"}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        win.matches === 5
                                                            ? "success"
                                                            : win.matches === 4
                                                              ? "info"
                                                              : "warning"
                                                    }
                                                >
                                                    {win.matches} Match
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-semibold">
                                                ${Number(win.prize_amount).toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        win.payout_status === "paid"
                                                            ? "success"
                                                            : win.payout_status === "verified"
                                                              ? "info"
                                                              : "warning"
                                                    }
                                                >
                                                    {win.payout_status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Link to={`/results/${win.draw_id}`}>
                                                    <Button variant="ghost" size="sm">
                                                        View Draw
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
