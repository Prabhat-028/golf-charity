import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useParams, Link } from "react-router";
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
import {
    Trophy,
    Calendar,
    DollarSign,
    Heart,
    ArrowLeft,
    Target,
    Users,
} from "lucide-react";
import { format } from "date-fns";

export default function ResultDetail() {
    const { id } = useParams();

    const { data: draw, isLoading: drawLoading } = useQuery({
        queryKey: ["draw", id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("draws")
                .select("*")
                .eq("id", id)
                .single();
            if (error) throw error;
            return data;
        },
        enabled: !!id,
    });

    const { data: winners, isLoading: winnersLoading } = useQuery({
        queryKey: ["draw-winners", id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("winners")
                .select("*, profiles(full_name, email)")
                .eq("draw_id", id)
                .order("prize_amount", { ascending: false });
            if (error) throw error;
            return data;
        },
        enabled: !!id,
    });

    const { data: donations, isLoading: donationsLoading } = useQuery({
        queryKey: ["draw-donations", id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("charity_donations")
                .select("*, charity:charities(name, logo_url)")
                .eq("draw_id", id);
            if (error) throw error;
            return data;
        },
        enabled: !!id,
    });

    if (drawLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-64" />
                <Card>
                    <CardContent className="pt-6">
                        <Skeleton className="h-32" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!draw) {
        return (
            <div className="space-y-6">
                <Link to="/results">
                    <Button variant="ghost">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Results
                    </Button>
                </Link>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center py-12">
                            <p className="text-gray-500">Draw not found</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const totalPrize =
        draw.five_match_prize + draw.four_match_prize + draw.three_match_prize;
    const fiveMatchWinners = winners?.filter((w) => w.matches === 5) || [];
    const fourMatchWinners = winners?.filter((w) => w.matches === 4) || [];
    const threeMatchWinners = winners?.filter((w) => w.matches === 3) || [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Link to="/results">
                    <Button variant="ghost">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Results
                    </Button>
                </Link>
                <Badge variant="info">
                    <Calendar className="h-3 w-3 mr-1" />
                    {format(new Date(draw.draw_date), "MMMM yyyy")}
                </Badge>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Winning Numbers</CardTitle>
                    <CardDescription>
                        {format(new Date(draw.draw_date), "MMMM d, yyyy")} Draw
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4 justify-center py-6">
                        {draw.numbers.map((num, i) => (
                            <div
                                key={i}
                                className="w-20 h-20 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 text-white flex items-center justify-center border-2 border-gray-700 shadow-lg"
                            >
                                <span className="text-3xl font-bold">
                                    {num}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                            <p className="text-sm text-gray-600 mb-1">
                                5 Match Prize
                            </p>
                            <p className="text-xl font-bold text-gray-900">
                                ${draw.five_match_prize.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {fiveMatchWinners.length} winner(s)
                            </p>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm text-gray-600 mb-1">
                                4 Match Prize
                            </p>
                            <p className="text-xl font-bold text-gray-900">
                                ${draw.four_match_prize.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {fourMatchWinners.length} winner(s)
                            </p>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                            <p className="text-sm text-gray-600 mb-1">
                                3 Match Prize
                            </p>
                            <p className="text-xl font-bold text-gray-900">
                                ${draw.three_match_prize.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {threeMatchWinners.length} winner(s)
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Winners</CardTitle>
                            <CardDescription>
                                {winners?.length || 0} total winner(s) for this
                                draw
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-yellow-500" />
                            <span className="font-semibold text-gray-900">
                                ${totalPrize.toLocaleString()} Total
                            </span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {winnersLoading ? (
                        <div className="space-y-2">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-12" />
                            ))}
                        </div>
                    ) : !winners || winners.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500">
                                No winners for this draw
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Player</TableHead>
                                        <TableHead>Matched</TableHead>
                                        <TableHead>Matched Numbers</TableHead>
                                        <TableHead>Prize Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {winners.map((winner) => (
                                        <TableRow key={winner.id}>
                                            <TableCell className="font-medium">
                                                {winner.profiles?.full_name ||
                                                    "Unknown"}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Target className="h-4 w-4 text-primary-600" />
                                                    <span className="font-semibold">
                                                        {winner.matches} numbers
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    {winner.matched_numbers.map(
                                                        (num, i) => (
                                                            <div
                                                                key={i}
                                                                className="w-7 h-7 rounded bg-primary-600 text-white flex items-center justify-center text-xs font-bold"
                                                            >
                                                                {num}
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-semibold text-green-600">
                                                $
                                                {winner.prize_amount?.toLocaleString() ||
                                                    "0"}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        winner.payout_status ===
                                                        "paid"
                                                            ? "success"
                                                            : winner.payout_status ===
                                                                "pending"
                                                              ? "warning"
                                                              : "default"
                                                    }
                                                >
                                                    {winner.payout_status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Heart className="h-5 w-5 text-pink-600" />
                        <CardTitle>Charity Impact</CardTitle>
                    </div>
                    <CardDescription>
                        10% of the prize pool goes to charity
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {donationsLoading ? (
                        <Skeleton className="h-24" />
                    ) : !donations || donations.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500">
                                No charity donations recorded yet
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {donations.map((donation) => (
                                <div
                                    key={donation.id}
                                    className="flex items-center justify-between p-4 bg-pink-50 rounded-lg border border-pink-200"
                                >
                                    <div className="flex items-center gap-3">
                                        {donation.charity?.logo_url ? (
                                            <img
                                                src={donation.charity.logo_url}
                                                alt={donation.charity.name}
                                                className="w-12 h-12 rounded-lg object-contain bg-white p-1"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-lg bg-pink-200 flex items-center justify-center">
                                                <Heart className="h-6 w-6 text-pink-600" />
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {donation.charity?.name ||
                                                    "Unknown Charity"}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                Donation from this draw
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-bold text-pink-600">
                                            ${donation.amount.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Heart className="h-5 w-5 text-primary-600" />
                                        <span className="font-medium text-gray-900">
                                            Total Donated
                                        </span>
                                    </div>
                                    <span className="text-xl font-bold text-primary-600">
                                        $
                                        {donations
                                            .reduce(
                                                (sum, d) => sum + d.amount,
                                                0,
                                            )
                                            .toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
