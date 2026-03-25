import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import {
    Users,
    DollarSign,
    Trophy,
    Heart,
    TrendingUp,
    BarChart3,
} from "lucide-react";
import { format } from "date-fns";

function buildRevenueTrend(draws) {
    const monthMap = new Map();

    for (const draw of draws || []) {
        const key = format(new Date(draw.draw_date), "yyyy-MM");
        const label = format(new Date(draw.draw_date), "MMM yy");
        const gross = Number(draw.prize_pool || 0) + Number(draw.charity_amount || 0);
        const donation = Number(draw.charity_amount || 0);

        if (!monthMap.has(key)) {
            monthMap.set(key, {
                key,
                label,
                grossRevenue: 0,
                donations: 0,
                draws: 0,
            });
        }

        const month = monthMap.get(key);
        month.grossRevenue += gross;
        month.donations += donation;
        month.draws += 1;
    }

    return Array.from(monthMap.values())
        .sort((a, b) => a.key.localeCompare(b.key))
        .slice(-6);
}

function buildLinePath(data, accessor, width, height) {
    if (!data.length) return "";

    const values = data.map((item) => accessor(item));
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = Math.max(max - min, 1);

    return data
        .map((item, index) => {
            const x = (index / Math.max(data.length - 1, 1)) * width;
            const y = height - ((accessor(item) - min) / range) * height;
            return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
        })
        .join(" ");
}

export default function AdminDashboard() {
    const { data: stats, isLoading } = useQuery({
        queryKey: ["admin-stats"],
        queryFn: async () => {
            const [users, subs, draws, donations] = await Promise.all([
                supabase.from("profiles").select("id", { count: "exact" }),
                supabase
                    .from("subscriptions")
                    .select("id, plan")
                    .eq("status", "active"),
                supabase
                    .from("draws")
                    .select("prize_pool, charity_amount, draw_date")
                    .eq("status", "completed"),
                supabase.from("charity_donations").select("amount"),
            ]);
            const totalRevenue = (subs.data?.length || 0) * 10; // Simplified
            const totalPrizes =
                draws.data?.reduce((sum, d) => sum + Number(d.prize_pool), 0) ||
                0;
            const totalDonated =
                donations.data?.reduce((sum, d) => sum + Number(d.amount), 0) ||
                0;
            const trend = buildRevenueTrend(draws.data || []);
            return {
                totalUsers: users.count || 0,
                activeSubscribers: subs.data?.length || 0,
                monthlyPlan:
                    subs.data?.filter((s) => s.plan === "monthly").length || 0,
                yearlyPlan:
                    subs.data?.filter((s) => s.plan === "yearly").length || 0,
                totalRevenue,
                totalPrizes,
                totalDonated,
                drawsCompleted: draws.data?.length || 0,
                trend,
            };
        },
    });

    const revenueLinePath = buildLinePath(
        stats?.trend || [],
        (point) => point.grossRevenue,
        560,
        180,
    );

    const donationLinePath = buildLinePath(
        stats?.trend || [],
        (point) => point.donations,
        560,
        180,
    );

    const monthlyShare =
        stats?.activeSubscribers > 0
            ? Math.round((stats.monthlyPlan / stats.activeSubscribers) * 100)
            : 0;
    const yearlyShare =
        stats?.activeSubscribers > 0
            ? Math.round((stats.yearlyPlan / stats.activeSubscribers) * 100)
            : 0;

    const statCards = [
        {
            label: "Total Users",
            value: stats?.totalUsers,
            icon: Users,
            color: "bg-blue-500",
        },
        {
            label: "Active Subscribers",
            value: stats?.activeSubscribers,
            icon: TrendingUp,
            color: "bg-green-500",
        },
        {
            label: "Total Prizes Paid",
            value: `$${stats?.totalPrizes?.toLocaleString() || 0}`,
            icon: Trophy,
            color: "bg-yellow-500",
        },
        {
            label: "Charity Donations",
            value: `$${stats?.totalDonated?.toLocaleString() || 0}`,
            icon: Heart,
            color: "bg-pink-500",
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">
                    Admin Overview
                </h1>
                <p className="text-gray-400 mt-1">
                    Platform statistics and management
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat, i) => (
                    <Card key={i} className="bg-gray-800 border-gray-700">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-lg ${stat.color}`}>
                                    <stat.icon className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">
                                        {stat.label}
                                    </p>
                                    {isLoading ? (
                                        <Skeleton className="h-7 w-20 bg-gray-700" />
                                    ) : (
                                        <p className="text-2xl font-bold text-white">
                                            {stat.value}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                        <CardTitle className="text-white">
                            Subscription Breakdown
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <Skeleton className="h-32 bg-gray-700" />
                        ) : (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">
                                        Monthly Plans
                                    </span>
                                    <span className="text-white font-semibold">{stats?.monthlyPlan} ({monthlyShare}%)</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                    <div
                                        className="bg-blue-500 h-2 rounded-full"
                                        style={{
                                            width: `${(stats?.monthlyPlan / (stats?.activeSubscribers || 1)) * 100}%`,
                                        }}
                                    />
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">
                                        Yearly Plans
                                    </span>
                                    <span className="text-white font-semibold">{stats?.yearlyPlan} ({yearlyShare}%)</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                    <div
                                        className="bg-green-500 h-2 rounded-full"
                                        style={{
                                            width: `${(stats?.yearlyPlan / (stats?.activeSubscribers || 1)) * 100}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                        <CardTitle className="text-white">
                            Quick Stats
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <Skeleton className="h-32 bg-gray-700" />
                        ) : (
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">
                                        Draws Completed
                                    </span>
                                    <span className="text-white font-semibold">
                                        {stats?.drawsCompleted}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">
                                        Charity Rate
                                    </span>
                                    <span className="text-white font-semibold">
                                        10%
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">
                                        Prize Pool Split
                                    </span>
                                    <span className="text-white font-semibold">
                                        40/35/25%
                                    </span>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Revenue and Donation Trend (Last 6 Draw Months)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <Skeleton className="h-64 bg-gray-700" />
                    ) : !stats?.trend?.length ? (
                        <p className="text-gray-400">No completed draw data available yet.</p>
                    ) : (
                        <div className="space-y-4">
                            <div className="overflow-x-auto">
                                <svg viewBox="0 0 560 220" className="w-full min-w-140 h-56">
                                    <line x1="0" y1="180" x2="560" y2="180" stroke="#4b5563" strokeWidth="1" />
                                    <path
                                        d={revenueLinePath}
                                        fill="none"
                                        stroke="#22c55e"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                    />
                                    <path
                                        d={donationLinePath}
                                        fill="none"
                                        stroke="#ec4899"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </div>
                            <div className="flex items-center gap-6 text-sm">
                                <div className="flex items-center gap-2 text-gray-300">
                                    <span className="inline-block h-3 w-3 rounded-full bg-green-500" />
                                    Gross Revenue
                                </div>
                                <div className="flex items-center gap-2 text-gray-300">
                                    <span className="inline-block h-3 w-3 rounded-full bg-pink-500" />
                                    Donations
                                </div>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-3">
                                {stats.trend.map((point) => (
                                    <div key={point.key} className="rounded-lg border border-gray-700 p-3">
                                        <p className="text-xs text-gray-400">{point.label}</p>
                                        <p className="text-sm text-white font-semibold">${Math.round(point.grossRevenue).toLocaleString()}</p>
                                        <p className="text-xs text-pink-400">Donation ${Math.round(point.donations).toLocaleString()}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
