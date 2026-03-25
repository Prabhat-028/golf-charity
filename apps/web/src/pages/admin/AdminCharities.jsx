import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/context/ToastContext";
import { format } from "date-fns";
import { Plus, Edit, Heart } from "lucide-react";

export default function AdminCharities() {
    const queryClient = useQueryClient();
    const { addToast } = useToast();
    const [showModal, setShowModal] = useState(false);
    const [showAllocationModal, setShowAllocationModal] = useState(false);
    const [editingCharity, setEditingCharity] = useState(null);
    const [selectedDraw, setSelectedDraw] = useState(null);
    const [allocationInputs, setAllocationInputs] = useState({});
    const [form, setForm] = useState({
        name: "",
        description: "",
        website_url: "",
        logo_url: "",
    });

    const { data: charities, isLoading } = useQuery({
        queryKey: ["admin-charities"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("charities")
                .select("*")
                .order("name");
            if (error) throw error;
            return data;
        },
    });

    const { data: completedDraws, isLoading: drawsLoading } = useQuery({
        queryKey: ["charity-allocation-draws"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("draws")
                .select("id, draw_date, charity_amount, status")
                .eq("status", "completed")
                .order("draw_date", { ascending: false });

            if (error) throw error;
            return data;
        },
    });

    const { data: donations, isLoading: donationsLoading } = useQuery({
        queryKey: ["charity-allocations"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("charity_donations")
                .select("draw_id, charity_id, amount");

            if (error) throw error;
            return data;
        },
    });

    const mutation = useMutation({
        mutationFn: async (data) => {
            if (editingCharity) {
                const { error } = await supabase
                    .from("charities")
                    .update(data)
                    .eq("id", editingCharity.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from("charities").insert(data);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-charities"] });
            setShowModal(false);
            setEditingCharity(null);
            setForm({
                name: "",
                description: "",
                website_url: "",
                logo_url: "",
            });
            addToast(
                editingCharity ? "Charity updated" : "Charity created",
                "success",
            );
        },
        onError: () => addToast("Failed to save charity", "error"),
    });

    const toggleMutation = useMutation({
        mutationFn: async ({ id, is_active }) => {
            const { error } = await supabase
                .from("charities")
                .update({ is_active })
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-charities"] });
            addToast("Charity status updated", "success");
        },
    });

    const allocationMutation = useMutation({
        mutationFn: async ({ drawId, rows }) => {
            const toInsert = rows
                .map((row) => ({
                    draw_id: drawId,
                    charity_id: row.charity_id,
                    amount: Number(row.amount || 0),
                }))
                .filter((row) => row.amount > 0);

            if (!toInsert.length) {
                throw new Error("Enter at least one allocation amount");
            }

            const { error: insertError } = await supabase
                .from("charity_donations")
                .insert(toInsert);

            if (insertError) throw insertError;

            const updates = toInsert.map((row) => {
                const charity = charities?.find((c) => c.id === row.charity_id);
                const current = Number(charity?.total_received || 0);
                return supabase
                    .from("charities")
                    .update({ total_received: current + row.amount })
                    .eq("id", row.charity_id);
            });

            const results = await Promise.all(updates);
            const failed = results.find((result) => result.error);
            if (failed?.error) throw failed.error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["charity-allocations"] });
            queryClient.invalidateQueries({ queryKey: ["admin-charities"] });
            setShowAllocationModal(false);
            setSelectedDraw(null);
            setAllocationInputs({});
            addToast("Donation allocations saved", "success");
        },
        onError: (error) => {
            addToast(error.message || "Failed to save allocations", "error");
        },
    });

    function openEdit(charity) {
        setEditingCharity(charity);
        setForm({
            name: charity.name,
            description: charity.description || "",
            website_url: charity.website_url || "",
            logo_url: charity.logo_url || "",
        });
        setShowModal(true);
    }

    function handleSubmit(e) {
        e.preventDefault();
        if (!form.name.trim()) return;
        mutation.mutate(form);
    }

    function openAllocation(draw) {
        setSelectedDraw(draw);
        const initial = {};
        for (const charity of charities || []) {
            initial[charity.id] = "";
        }
        setAllocationInputs(initial);
        setShowAllocationModal(true);
    }

    function handleSaveAllocation(e) {
        e.preventDefault();
        if (!selectedDraw) return;

        const rows = Object.entries(allocationInputs).map(
            ([charity_id, amount]) => ({ charity_id, amount: Number(amount || 0) }),
        );

        const allocationTotal = rows.reduce(
            (sum, row) => sum + Number(row.amount || 0),
            0,
        );
        const targetAmount = Number(selectedDraw.charity_amount || 0);

        if (allocationTotal <= 0) {
            addToast("Enter at least one positive allocation", "warning");
            return;
        }

        if (allocationTotal > targetAmount) {
            addToast("Allocation total cannot exceed draw charity amount", "error");
            return;
        }

        allocationMutation.mutate({
            drawId: selectedDraw.id,
            rows,
        });
    }

    const allocatedByDraw = (donations || []).reduce((acc, donation) => {
        acc[donation.draw_id] = (acc[donation.draw_id] || 0) + Number(donation.amount || 0);
        return acc;
    }, {});

    const drawAllocationSummary = (completedDraws || []).map((draw) => {
        const allocated = Number(allocatedByDraw[draw.id] || 0);
        const target = Number(draw.charity_amount || 0);
        const remaining = Math.max(target - allocated, 0);
        return {
            ...draw,
            allocated,
            target,
            remaining,
        };
    });

    const totalDonated =
        charities?.reduce((sum, c) => sum + Number(c.total_received), 0) || 0;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">
                        Charity Management
                    </h1>
                    <p className="text-gray-400 mt-1">
                        Manage charity partners
                    </p>
                </div>
                <Button
                    onClick={() => {
                        setEditingCharity(null);
                        setForm({
                            name: "",
                            description: "",
                            website_url: "",
                            logo_url: "",
                        });
                        setShowModal(true);
                    }}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Charity
                </Button>
            </div>

            <Card className="bg-pink-900/20 border-pink-700">
                <CardContent className="py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-pink-900/50 rounded-lg">
                                <Heart className="h-6 w-6 text-pink-400" />
                            </div>
                            <div>
                                <p className="text-pink-300">
                                    Total Donated to Charities
                                </p>
                                <p className="text-3xl font-bold text-white">
                                    ${totalDonated.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                    <CardTitle className="text-white">Charity Donation Allocation</CardTitle>
                </CardHeader>
                <CardContent>
                    {drawsLoading || donationsLoading ? (
                        <Skeleton className="h-40 bg-gray-700" />
                    ) : drawAllocationSummary.length ? (
                        <div className="space-y-3">
                            {drawAllocationSummary.map((draw) => (
                                <div
                                    key={draw.id}
                                    className="rounded-lg border border-gray-700 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                                >
                                    <div>
                                        <p className="text-white font-medium">
                                            Draw {format(new Date(draw.draw_date), "MMM yyyy")}
                                        </p>
                                        <p className="text-sm text-gray-400">
                                            Allocated ${draw.allocated.toLocaleString()} of ${draw.target.toLocaleString()} ({draw.remaining.toLocaleString()} remaining)
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            variant={draw.remaining > 0 ? "warning" : "success"}
                                        >
                                            {draw.remaining > 0 ? "Needs Allocation" : "Fully Allocated"}
                                        </Badge>
                                        {draw.remaining > 0 && (
                                            <Button
                                                size="sm"
                                                onClick={() => openAllocation(draw)}
                                            >
                                                Allocate
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-400">No completed draws available for allocation.</p>
                    )}
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {isLoading
                    ? [1, 2, 3].map((i) => (
                          <Card key={i} className="bg-gray-800 border-gray-700">
                              <CardContent className="p-6">
                                  <Skeleton className="h-32 bg-gray-700" />
                              </CardContent>
                          </Card>
                      ))
                    : !charities?.length
                      ? (
                            <Card className="bg-gray-800 border-gray-700 md:col-span-2 lg:col-span-3">
                                <CardContent className="py-12 text-center">
                                    <p className="text-white text-lg font-medium">
                                        No charities configured
                                    </p>
                                    <p className="text-gray-400 mt-2">
                                        Add your first charity partner to begin allocations.
                                    </p>
                                </CardContent>
                            </Card>
                        )
                    : charities?.map((charity) => (
                          <Card
                              key={charity.id}
                              className="bg-gray-800 border-gray-700"
                          >
                              <CardContent className="p-6">
                                  <div className="flex items-start justify-between mb-4">
                                      <div className="flex items-center gap-3">
                                          {charity.logo_url ? (
                                              <img
                                                  src={charity.logo_url}
                                                  alt=""
                                                  className="w-12 h-12 rounded-lg object-cover"
                                              />
                                          ) : (
                                              <div className="w-12 h-12 bg-pink-900/50 rounded-lg flex items-center justify-center">
                                                  <Heart className="h-6 w-6 text-pink-400" />
                                              </div>
                                          )}
                                          <div>
                                              <h3 className="font-semibold text-white">
                                                  {charity.name}
                                              </h3>
                                              <Badge
                                                  variant={
                                                      charity.is_active
                                                          ? "success"
                                                          : "default"
                                                  }
                                              >
                                                  {charity.is_active
                                                      ? "Active"
                                                      : "Inactive"}
                                              </Badge>
                                          </div>
                                      </div>
                                      <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => openEdit(charity)}
                                      >
                                          <Edit className="h-4 w-4" />
                                      </Button>
                                  </div>
                                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                                      {charity.description || "No description"}
                                  </p>
                                  <div className="flex justify-between items-center pt-4 border-t border-gray-700">
                                      <div>
                                          <p className="text-gray-500 text-xs">
                                              Total Received
                                          </p>
                                          <p className="text-white font-semibold">
                                              $
                                              {charity.total_received.toLocaleString()}
                                          </p>
                                      </div>
                                      <Button
                                          size="sm"
                                          variant={
                                              charity.is_active
                                                  ? "outline"
                                                  : "secondary"
                                          }
                                          onClick={() =>
                                              toggleMutation.mutate({
                                                  id: charity.id,
                                                  is_active: !charity.is_active,
                                              })
                                          }
                                      >
                                          {charity.is_active
                                              ? "Deactivate"
                                              : "Activate"}
                                      </Button>
                                  </div>
                              </CardContent>
                          </Card>
                      ))}
            </div>

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingCharity ? "Edit Charity" : "Add Charity"}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Name"
                        value={form.name}
                        onChange={(e) =>
                            setForm({ ...form, name: e.target.value })
                        }
                        required
                    />
                    <Input
                        label="Description"
                        value={form.description}
                        onChange={(e) =>
                            setForm({ ...form, description: e.target.value })
                        }
                    />
                    <Input
                        label="Website URL"
                        type="url"
                        value={form.website_url}
                        onChange={(e) =>
                            setForm({ ...form, website_url: e.target.value })
                        }
                    />
                    <Input
                        label="Logo URL"
                        type="url"
                        value={form.logo_url}
                        onChange={(e) =>
                            setForm({ ...form, logo_url: e.target.value })
                        }
                    />
                    <div className="flex gap-3 justify-end pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" loading={mutation.isPending}>
                            {editingCharity ? "Save Changes" : "Add Charity"}
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={showAllocationModal}
                onClose={() => setShowAllocationModal(false)}
                title="Allocate Charity Donations"
                size="lg"
            >
                <form onSubmit={handleSaveAllocation} className="space-y-4">
                    <p className="text-sm text-gray-600">
                        {selectedDraw
                            ? `Allocate donation amount for ${format(new Date(selectedDraw.draw_date), "MMMM yyyy")} (target $${Number(selectedDraw.charity_amount || 0).toLocaleString()})`
                            : "Select allocation amounts"}
                    </p>

                    <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                        {(charities || []).map((charity) => (
                            <div key={charity.id} className="grid grid-cols-1 sm:grid-cols-[1fr_180px] items-center gap-3">
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{charity.name}</p>
                                    <p className="text-xs text-gray-500">Current total ${Number(charity.total_received || 0).toLocaleString()}</p>
                                </div>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={allocationInputs[charity.id] ?? ""}
                                    onChange={(e) =>
                                        setAllocationInputs((prev) => ({
                                            ...prev,
                                            [charity.id]: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-3 justify-end pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowAllocationModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" loading={allocationMutation.isPending}>
                            Save Allocation
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
