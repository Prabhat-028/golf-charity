import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
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
import { useToast } from "@/context/ToastContext";
import { format } from "date-fns";

const STATUS_OPTIONS = ["pending", "in_review", "completed", "rejected"];

export default function AdminGdprRequests() {
    const queryClient = useQueryClient();
    const { addToast } = useToast();

    const { data: requests, isLoading } = useQuery({
        queryKey: ["admin-gdpr-requests"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("gdpr_requests")
                .select("*, profile:profiles(full_name, email)")
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data;
        },
    });

    const statusMutation = useMutation({
        mutationFn: async ({ id, status }) => {
            const { error } = await supabase
                .from("gdpr_requests")
                .update({ status, updated_at: new Date().toISOString() })
                .eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-gdpr-requests"] });
            addToast("GDPR request updated", "success");
        },
        onError: () => addToast("Failed to update GDPR request", "error"),
    });

    const pendingCount = requests?.filter((r) => r.status === "pending").length || 0;
    const inReviewCount = requests?.filter((r) => r.status === "in_review").length || 0;
    const completedCount = requests?.filter((r) => r.status === "completed").length || 0;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">GDPR Requests</h1>
                <p className="text-gray-400 mt-1">
                    Review and process privacy rights requests from users.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-yellow-900/20 border-yellow-700">
                    <CardContent className="pt-6 text-center">
                        <p className="text-yellow-400 text-sm">Pending</p>
                        <p className="text-3xl font-bold text-yellow-400">{pendingCount}</p>
                    </CardContent>
                </Card>
                <Card className="bg-blue-900/20 border-blue-700">
                    <CardContent className="pt-6 text-center">
                        <p className="text-blue-400 text-sm">In Review</p>
                        <p className="text-3xl font-bold text-blue-400">{inReviewCount}</p>
                    </CardContent>
                </Card>
                <Card className="bg-green-900/20 border-green-700">
                    <CardContent className="pt-6 text-center">
                        <p className="text-green-400 text-sm">Completed</p>
                        <p className="text-3xl font-bold text-green-400">{completedCount}</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                    <CardTitle className="text-white">All Requests</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-6">
                            <Skeleton className="h-48 bg-gray-700" />
                        </div>
                    ) : requests?.length ? (
                        <Table>
                            <TableHeader className="bg-gray-700">
                                <TableRow className="border-gray-600 hover:bg-gray-700">
                                    <TableHead className="text-gray-300">User</TableHead>
                                    <TableHead className="text-gray-300">Type</TableHead>
                                    <TableHead className="text-gray-300">Created</TableHead>
                                    <TableHead className="text-gray-300">Status</TableHead>
                                    <TableHead className="text-gray-300">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests.map((request) => (
                                    <TableRow key={request.id} className="border-gray-600 hover:bg-gray-700">
                                        <TableCell>
                                            <div>
                                                <p className="text-white font-medium">
                                                    {request.profile?.full_name || "Unknown"}
                                                </p>
                                                <p className="text-gray-400 text-sm">
                                                    {request.profile?.email || "-"}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="info">{request.request_type}</Badge>
                                        </TableCell>
                                        <TableCell className="text-gray-300">
                                            {format(new Date(request.created_at), "MMM d, yyyy")}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    request.status === "completed"
                                                        ? "success"
                                                        : request.status === "rejected"
                                                          ? "error"
                                                          : request.status === "in_review"
                                                            ? "info"
                                                            : "warning"
                                                }
                                            >
                                                {request.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-2">
                                                {STATUS_OPTIONS.map((status) => (
                                                    <Button
                                                        key={status}
                                                        size="sm"
                                                        variant={
                                                            request.status === status
                                                                ? "primary"
                                                                : "outline"
                                                        }
                                                        onClick={() =>
                                                            statusMutation.mutate({
                                                                id: request.id,
                                                                status,
                                                            })
                                                        }
                                                        loading={statusMutation.isPending}
                                                        disabled={request.status === status}
                                                    >
                                                        {status}
                                                    </Button>
                                                ))}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="p-12 text-center text-gray-400">
                            No GDPR requests found
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
