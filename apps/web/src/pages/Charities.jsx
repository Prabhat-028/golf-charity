import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/Skeleton";
import QueryErrorState from "@/components/ui/QueryErrorState";
import {
    Heart,
    ExternalLink,
    TrendingUp,
    Users,
    DollarSign,
} from "lucide-react";

export default function Charities() {
    const {
        data: charities,
        isLoading: charitiesLoading,
        isError: charitiesError,
        refetch: refetchCharities,
    } = useQuery({
        queryKey: ["charities"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("charities")
                .select("*")
                .eq("is_active", true)
                .order("name");
            if (error) throw error;
            return data;
        },
    });

    const {
        data: donations,
        isLoading: donationsLoading,
        isError: donationsError,
        refetch: refetchDonations,
    } = useQuery({
        queryKey: ["charity-donations-summary"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("charity_donations")
                .select("charity_id, amount");
            if (error) throw error;
            return data;
        },
    });

    const totalDonated = donations?.reduce((sum, d) => sum + d.amount, 0) || 0;
    const charitiesCount = charities?.length || 0;

    const getDonationTotal = (charityId) => {
        return (
            donations
                ?.filter((d) => d.charity_id === charityId)
                .reduce((sum, d) => sum + d.amount, 0) || 0
        );
    };

    if (charitiesLoading || donationsLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-64" />
                <div className="grid gap-6 md:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-32" />
                    ))}
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-64" />
                    ))}
                </div>
            </div>
        );
    }

    if (charitiesError || donationsError) {
        return (
            <QueryErrorState
                title="Unable to load charity data"
                message="We couldn't fetch charity details right now. Please try again."
                onRetry={() => {
                    refetchCharities();
                    refetchDonations();
                }}
            />
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">
                    Our Charity Partners
                </h1>
                <p className="text-gray-600 mt-1">
                    10% of every subscription goes directly to these amazing
                    organizations
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-pink-100 rounded-lg">
                                <Heart className="h-6 w-6 text-pink-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">
                                    Total Donated
                                </p>
                                <p className="text-2xl font-bold text-gray-900">
                                    ${totalDonated.toLocaleString()}
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
                                    Charity Partners
                                </p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {charitiesCount}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <TrendingUp className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Impact</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    10%
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {!charities || charities.length === 0 ? (
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center py-12">
                            <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg mb-2">
                                No charities added yet
                            </p>
                            <p className="text-sm text-gray-400">
                                Charity partners will appear here once they're
                                added by the admin
                            </p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {charities.map((charity) => {
                        const donated = getDonationTotal(charity.id);

                        return (
                            <Card
                                key={charity.id}
                                className="hover:shadow-md transition-shadow"
                            >
                                <CardHeader>
                                    <div className="flex items-start gap-4">
                                        {charity.logo_url ? (
                                            <img
                                                src={charity.logo_url}
                                                alt={charity.name}
                                                className="w-16 h-16 rounded-lg object-contain bg-white p-2 border border-gray-200"
                                            />
                                        ) : (
                                            <div className="w-16 h-16 rounded-lg bg-pink-100 flex items-center justify-center">
                                                <Heart className="h-8 w-8 text-pink-600" />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <CardTitle className="text-base">
                                                {charity.name}
                                            </CardTitle>
                                            {charity.website_url && (
                                                <a
                                                    href={charity.website_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-primary-600 hover:underline flex items-center gap-1 mt-1"
                                                >
                                                    Visit website
                                                    <ExternalLink className="h-3 w-3" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                                        {charity.description}
                                    </p>
                                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">
                                                Total Donated
                                            </span>
                                            <span className="text-lg font-bold text-green-600">
                                                ${donated.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            <Card className="bg-linear-to-r from-primary-50 to-pink-50 border-primary-200">
                <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-white rounded-lg shadow-sm">
                            <Heart className="h-6 w-6 text-pink-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-2">
                                Your Impact Matters
                            </h3>
                            <p className="text-sm text-gray-700 leading-relaxed">
                                Every month, 10% of all subscription revenue is
                                distributed to our charity partners. By
                                participating in our golf draws, you're not just
                                playing for prizes—you're supporting great
                                causes and making a real difference in your
                                community.
                            </p>
                            <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                                <div className="p-3 bg-white rounded-lg">
                                    <p className="text-2xl font-bold text-primary-600">
                                        ${totalDonated.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1">
                                        Total Impact
                                    </p>
                                </div>
                                <div className="p-3 bg-white rounded-lg">
                                    <p className="text-2xl font-bold text-primary-600">
                                        10%
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1">
                                        To Charity
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
