import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/context/ToastContext";
import { format } from "date-fns";
import { CheckCircle, Download, Eye, Upload } from "lucide-react";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function buildStoragePath(winnerId, userId, fileName) {
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
    return `${userId}/${winnerId}-${Date.now()}-${safeName}`;
}

export default function AdminWinners() {
    const queryClient = useQueryClient();
    const { addToast } = useToast();
    const [uploadingWinnerId, setUploadingWinnerId] = useState(null);
    const [previewUrl, setPreviewUrl] = useState("");
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    async function handlePreviewImage(imagePathOrUrl) {
        try {
            if (!imagePathOrUrl) return;

            if (/^https?:\/\//i.test(imagePathOrUrl)) {
                setPreviewUrl(imagePathOrUrl);
                setIsPreviewOpen(true);
                return;
            }

            const { data, error } = await supabase.storage
                .from("winner-verifications")
                .createSignedUrl(imagePathOrUrl, 60);

            if (error || !data?.signedUrl) {
                throw error || new Error("Could not generate preview URL");
            }

            setPreviewUrl(data.signedUrl);
            setIsPreviewOpen(true);
        } catch (error) {
            addToast(error.message || "Failed to preview image", "error");
        }
    }

    async function handleVerificationUpload(winner, file) {
        if (!file) return;

        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            addToast("Please upload a JPG, PNG, or WEBP image", "error");
            return;
        }

        if (file.size > MAX_IMAGE_SIZE) {
            addToast("Image must be 5MB or smaller", "error");
            return;
        }

        const storagePath = buildStoragePath(winner.id, winner.user_id, file.name);
        setUploadingWinnerId(winner.id);

        try {
            const { error: uploadError } = await supabase.storage
                .from("winner-verifications")
                .upload(storagePath, file, { upsert: true, contentType: file.type });

            if (uploadError) throw uploadError;

            const { error: updateError } = await supabase
                .from("winners")
                .update({ verification_image_url: storagePath })
                .eq("id", winner.id);

            if (updateError) throw updateError;

            addToast("Verification image uploaded", "success");
            queryClient.invalidateQueries({ queryKey: ["admin-winners"] });
        } catch (error) {
            addToast(error.message || "Failed to upload image", "error");
        } finally {
            setUploadingWinnerId(null);
        }
    }

    const { data: winners, isLoading } = useQuery({
        queryKey: ["admin-winners"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("winners")
                .select(
                    "*, profile:profiles(full_name, email), draw:draws(draw_date)",
                )
                .order("created_at", { ascending: false });
            if (error) throw error;
            return data;
        },
    });

    const verifyMutation = useMutation({
        mutationFn: async ({ id, status }) => {
            const { error } = await supabase
                .from("winners")
                .update({ payout_status: status })
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-winners"] });
            addToast("Winner status updated", "success");
        },
        onError: () => addToast("Failed to update status", "error"),
    });

    const pending = winners?.filter((w) => w.payout_status === "pending") || [];
    const verified =
        winners?.filter((w) => w.payout_status === "verified") || [];
    const paid = winners?.filter((w) => w.payout_status === "paid") || [];

    function handleExportWinners() {
        const rows = (winners || []).map((winner) => ({
            id: winner.id,
            user_id: winner.user_id,
            winner_name: winner.profile?.full_name || "",
            winner_email: winner.profile?.email || "",
            draw_date: winner.draw?.draw_date || "",
            matches: winner.matches,
            prize_amount: winner.prize_amount,
            payout_status: winner.payout_status,
            verification_image_url: winner.verification_image_url || "",
            created_at: winner.created_at,
        }));

        downloadCsv("admin-winners.csv", rows);
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">
                        Winner Verification
                    </h1>
                    <p className="text-gray-400 mt-1">
                        Verify and process winner payouts
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={handleExportWinners}
                    disabled={!winners?.length}
                >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-yellow-900/20 border-yellow-700">
                    <CardContent className="pt-6 text-center">
                        <p className="text-yellow-400 text-sm">Pending</p>
                        <p className="text-3xl font-bold text-yellow-400">
                            {pending.length}
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-blue-900/20 border-blue-700">
                    <CardContent className="pt-6 text-center">
                        <p className="text-blue-400 text-sm">Verified</p>
                        <p className="text-3xl font-bold text-blue-400">
                            {verified.length}
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-green-900/20 border-green-700">
                    <CardContent className="pt-6 text-center">
                        <p className="text-green-400 text-sm">Paid</p>
                        <p className="text-3xl font-bold text-green-400">
                            {paid.length}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                    <CardTitle className="text-white">All Winners</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-6">
                            <Skeleton className="h-48 bg-gray-700" />
                        </div>
                    ) : winners?.length ? (
                        <Table>
                            <TableHeader className="bg-gray-700">
                                <TableRow className="border-gray-600 hover:bg-gray-700">
                                    <TableHead className="text-gray-300">
                                        Winner
                                    </TableHead>
                                    <TableHead className="text-gray-300">
                                        Draw
                                    </TableHead>
                                    <TableHead className="text-gray-300">
                                        Match
                                    </TableHead>
                                    <TableHead className="text-gray-300">
                                        Prize
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
                                {winners.map((w) => (
                                    <TableRow
                                        key={w.id}
                                        className="border-gray-600 hover:bg-gray-700"
                                    >
                                        <TableCell>
                                            <div>
                                                <p className="text-white font-medium">
                                                    {w.profile?.full_name ||
                                                        "Unknown"}
                                                </p>
                                                <p className="text-gray-400 text-sm">
                                                    {w.profile?.email}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-gray-300">
                                            {w.draw?.draw_date
                                                ? format(
                                                      new Date(
                                                          w.draw.draw_date,
                                                      ),
                                                      "MMM yyyy",
                                                  )
                                                : "-"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    w.matches === 5
                                                        ? "success"
                                                        : w.matches === 4
                                                          ? "info"
                                                          : "warning"
                                                }
                                            >
                                                {w.matches === 5
                                                    ? "5 Match"
                                                    : w.matches === 4
                                                      ? "4 Match"
                                                      : "3 Match"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-white font-semibold">
                                            ${w.prize_amount.toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    w.payout_status === "paid"
                                                        ? "success"
                                                        : w.payout_status ===
                                                            "verified"
                                                          ? "info"
                                                          : "warning"
                                                }
                                            >
                                                {w.payout_status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <input
                                                    id={`upload-proof-${w.id}`}
                                                    type="file"
                                                    accept="image/jpeg,image/png,image/webp"
                                                    className="hidden"
                                                    onChange={(event) => {
                                                        const file =
                                                            event.target.files?.[0];
                                                        handleVerificationUpload(
                                                            w,
                                                            file,
                                                        );
                                                        event.target.value = "";
                                                    }}
                                                />
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    loading={uploadingWinnerId === w.id}
                                                    onClick={() => {
                                                        const input =
                                                            document.getElementById(
                                                                `upload-proof-${w.id}`,
                                                            );
                                                        if (input) {
                                                            input.click();
                                                        }
                                                    }}
                                                >
                                                    <Upload className="h-3 w-3 mr-1" />
                                                    {w.verification_image_url
                                                        ? "Replace"
                                                        : "Upload"}
                                                </Button>
                                                {w.verification_image_url && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() =>
                                                            handlePreviewImage(
                                                                w.verification_image_url,
                                                            )
                                                        }
                                                    >
                                                        <Eye className="h-3 w-3" />
                                                    </Button>
                                                )}
                                                {w.payout_status ===
                                                    "pending" && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() =>
                                                            verifyMutation.mutate(
                                                                {
                                                                    id: w.id,
                                                                    status: "verified",
                                                                },
                                                            )
                                                        }
                                                    >
                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                        Verify
                                                    </Button>
                                                )}
                                                {w.payout_status ===
                                                    "verified" && (
                                                    <Button
                                                        size="sm"
                                                        variant="secondary"
                                                        onClick={() =>
                                                            verifyMutation.mutate(
                                                                {
                                                                    id: w.id,
                                                                    status: "paid",
                                                                },
                                                            )
                                                        }
                                                    >
                                                        Mark Paid
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="p-12 text-center text-gray-400">
                            No winners yet
                        </div>
                    )}
                </CardContent>
            </Card>

            <Modal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                title="Verification Image"
                size="lg"
            >
                {previewUrl ? (
                    <img
                        src={previewUrl}
                        alt="Winner verification"
                        className="w-full h-auto rounded-lg"
                    />
                ) : (
                    <p className="text-sm text-gray-600">No preview available.</p>
                )}
            </Modal>
        </div>
    );
}
