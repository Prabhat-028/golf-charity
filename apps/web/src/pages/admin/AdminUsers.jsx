import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { downloadCsv } from "@/lib/csv";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "@/components/ui/Table";
import Avatar from "@/components/ui/Avatar";
import Skeleton from "@/components/ui/Skeleton";
import { format } from "date-fns";
import { Download, Mail } from "lucide-react";
import { useToast } from "@/context/ToastContext";

export default function AdminUsers() {
    const { addToast } = useToast();
    const [showBlastModal, setShowBlastModal] = useState(false);
    const [blastAudience, setBlastAudience] = useState("all");
    const [blastSubject, setBlastSubject] = useState("");
    const [blastBody, setBlastBody] = useState("");

    const { data: users, isLoading } = useQuery({
        queryKey: ["admin-users"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("profiles")
                .select(`*, subscription:subscriptions(plan, status)`)
                .order("created_at", { ascending: false });
            if (error) throw error;
            return data;
        },
    });

    function handleExportUsers() {
        const rows = (users || []).map((user) => {
            const sub = user.subscription?.[0];
            return {
                id: user.id,
                full_name: user.full_name || "",
                email: user.email || "",
                role: user.role || "user",
                subscription_plan: sub?.plan || "",
                subscription_status: sub?.status || "",
                joined_date: user.created_at
                    ? format(new Date(user.created_at), "yyyy-MM-dd")
                    : "",
            };
        });

        const ok = downloadCsv("admin-users.csv", rows);
        if (!ok) {
            return;
        }
    }

    function getBlastRecipients() {
        const source = users || [];

        if (blastAudience === "active") {
            return source
                .filter((user) => user.subscription?.[0]?.status === "active")
                .map((user) => user.email)
                .filter(Boolean);
        }

        if (blastAudience === "marketing") {
            return source
                .filter((user) => user.email_marketing)
                .map((user) => user.email)
                .filter(Boolean);
        }

        return source.map((user) => user.email).filter(Boolean);
    }

    function handlePrepareBlast() {
        if (!blastSubject.trim() || !blastBody.trim()) {
            addToast("Add both a subject and message", "warning");
            return;
        }

        const recipients = [...new Set(getBlastRecipients())];
        if (!recipients.length) {
            addToast("No recipients found for the selected audience", "warning");
            return;
        }

        downloadCsv(
            "email-blast-recipients.csv",
            recipients.map((email) => ({ email })),
        );

        const mailto = `mailto:?bcc=${encodeURIComponent(recipients.join(","))}&subject=${encodeURIComponent(blastSubject)}&body=${encodeURIComponent(blastBody)}`;

        if (mailto.length > 1800) {
            addToast(
                "Recipient list is large. Recipient CSV downloaded; use your email platform for sending.",
                "info",
            );
            return;
        }

        window.location.href = mailto;
        addToast("Email draft prepared in your mail app", "success");
        setShowBlastModal(false);
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">
                        User Management
                    </h1>
                    <p className="text-gray-400 mt-1">
                        View and manage platform users
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setShowBlastModal(true)}
                        disabled={!users?.length}
                    >
                        <Mail className="h-4 w-4 mr-2" />
                        Email Blast
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleExportUsers}
                        disabled={!users?.length}
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                    </Button>
                </div>
            </div>

            <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                    <CardTitle className="text-white">
                        All Users ({users?.length || 0})
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-6">
                            <Skeleton className="h-64 bg-gray-700" />
                        </div>
                    ) : !users?.length ? (
                        <div className="p-10 text-center">
                            <p className="text-white text-lg font-medium">
                                No users found
                            </p>
                            <p className="text-gray-400 mt-2">
                                User accounts will appear here after sign-up.
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-gray-700">
                                <TableRow className="border-gray-600 hover:bg-gray-700">
                                    <TableHead className="text-gray-300">
                                        User
                                    </TableHead>
                                    <TableHead className="text-gray-300">
                                        Email
                                    </TableHead>
                                    <TableHead className="text-gray-300">
                                        Role
                                    </TableHead>
                                    <TableHead className="text-gray-300">
                                        Subscription
                                    </TableHead>
                                    <TableHead className="text-gray-300">
                                        Joined
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users?.map((user) => {
                                    const sub = user.subscription?.[0];
                                    return (
                                        <TableRow
                                            key={user.id}
                                            className="border-gray-600 hover:bg-gray-700"
                                        >
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar
                                                        src={user.avatar_url}
                                                        alt={
                                                            user.full_name || ""
                                                        }
                                                        size="sm"
                                                    />
                                                    <span className="text-white font-medium">
                                                        {user.full_name ||
                                                            "Unknown"}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-gray-300">
                                                {user.email}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        user.role === "admin"
                                                            ? "info"
                                                            : "default"
                                                    }
                                                >
                                                    {user.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {sub ? (
                                                    <div className="flex items-center gap-2">
                                                        <Badge
                                                            variant={
                                                                sub.status ===
                                                                "active"
                                                                    ? "success"
                                                                    : "warning"
                                                            }
                                                        >
                                                            {sub.status}
                                                        </Badge>
                                                        <span className="text-gray-400 text-sm capitalize">
                                                            {sub.plan}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-500">
                                                        None
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-gray-400">
                                                {format(
                                                    new Date(user.created_at),
                                                    "MMM d, yyyy",
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Modal
                isOpen={showBlastModal}
                onClose={() => setShowBlastModal(false)}
                title="Email Blast"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Audience
                        </label>
                        <select
                            value={blastAudience}
                            onChange={(e) => setBlastAudience(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
                        >
                            <option value="all">All Users</option>
                            <option value="active">Active Subscribers</option>
                            <option value="marketing">Marketing Opt-In Users</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Subject
                        </label>
                        <input
                            value={blastSubject}
                            onChange={(e) => setBlastSubject(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2"
                            placeholder="Monthly draw reminder"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Message
                        </label>
                        <textarea
                            rows={5}
                            value={blastBody}
                            onChange={(e) => setBlastBody(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2"
                            placeholder="Write your update to users..."
                        />
                    </div>

                    <p className="text-xs text-gray-500">
                        A recipient CSV is always downloaded. If recipient count is small,
                        your mail app opens with a prepared draft.
                    </p>

                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowBlastModal(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handlePrepareBlast}>Prepare Blast</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
