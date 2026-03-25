import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter,
} from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/context/ToastContext";
import { Target, Save, Info } from "lucide-react";

export default function Scores() {
    const { profile } = useAuth();
    const { addToast } = useToast();
    const queryClient = useQueryClient();
    const [scoreInputs, setScoreInputs] = useState([
        { position: 1, score: "" },
        { position: 2, score: "" },
        { position: 3, score: "" },
        { position: 4, score: "" },
        { position: 5, score: "" },
    ]);
    const [errors, setErrors] = useState({});

    const { data: existingScores, isLoading } = useQuery({
        queryKey: ["scores", profile?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("scores")
                .select("*")
                .eq("user_id", profile.id)
                .order("position");
            if (error) throw error;
            return data;
        },
        enabled: !!profile?.id,
    });

    useEffect(() => {
        if (existingScores?.length) {
            setScoreInputs(
                [1, 2, 3, 4, 5].map((position) => {
                    const score = existingScores.find(
                        (s) => s.position === position,
                    );
                    return { position, score: score?.score?.toString() || "" };
                }),
            );
        }
    }, [existingScores]);

    const saveMutation = useMutation({
        mutationFn: async (scores) => {
            const validScores = scores.filter((s) => s.score !== "");

            for (const scoreData of validScores) {
                const { error } = await supabase.from("scores").upsert(
                    {
                        user_id: profile.id,
                        position: scoreData.position,
                        score: parseInt(scoreData.score),
                    },
                    { onConflict: "user_id,position" },
                );
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["scores"]);
            queryClient.invalidateQueries(["dashboard"]);
            addToast("Scores saved successfully!", "success");
        },
        onError: (error) => {
            addToast(`Failed to save scores: ${error.message}`, "error");
        },
    });

    const handleScoreChange = (position, value) => {
        if (value === "" || value === "-" || value === undefined) {
            setScoreInputs((prev) =>
                prev.map((s) =>
                    s.position === position ? { ...s, score: value } : s,
                ),
            );
            setErrors((prev) => ({ ...prev, [position]: null }));
            return;
        }

        const numValue = parseInt(value);
        if (isNaN(numValue)) return;

        if (numValue < 1 || numValue > 45) {
            setErrors((prev) => ({
                ...prev,
                [position]: "Score must be between 1 and 45",
            }));
        } else {
            setErrors((prev) => ({ ...prev, [position]: null }));
        }

        setScoreInputs((prev) =>
            prev.map((s) =>
                s.position === position ? { ...s, score: value } : s,
            ),
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const newErrors = {};
        scoreInputs.forEach((s) => {
            if (s.score !== "") {
                const numValue = parseInt(s.score);
                if (isNaN(numValue) || numValue < 1 || numValue > 45) {
                    newErrors[s.position] = "Score must be between 1 and 45";
                }
            }
        });

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            addToast("Please fix the errors before saving", "error");
            return;
        }

        saveMutation.mutate(scoreInputs);
    };

    const filledCount = scoreInputs.filter((s) => s.score !== "").length;
    const allFilled = filledCount === 5;

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-64" />
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-6 md:grid-cols-5">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Skeleton key={i} className="h-32" />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Your Scores
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Enter your 5 best Stableford scores to participate in
                        the monthly draw
                    </p>
                </div>
                <Badge variant={allFilled ? "success" : "warning"}>
                    {filledCount} / 5 scores
                </Badge>
            </div>

            <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                    <div className="flex gap-3">
                        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-900">
                            <p className="font-medium mb-1">How it works:</p>
                            <ul className="space-y-1 text-blue-800">
                                <li>
                                    • Enter 5 Stableford scores between 1-45
                                    points
                                </li>
                                <li>
                                    • Each score represents a round of golf
                                    you've played
                                </li>
                                <li>
                                    • These are your "lucky numbers" for the
                                    monthly draw
                                </li>
                                <li>
                                    • Match 3, 4, or 5 numbers to win prizes!
                                </li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Target className="h-5 w-5 text-primary-600" />
                            <CardTitle>Enter Your Scores</CardTitle>
                        </div>
                        <CardDescription>
                            {allFilled
                                ? "All scores entered! You're eligible for the next draw."
                                : "Fill in all 5 scores to be eligible for prizes."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-6 md:grid-cols-5">
                            {scoreInputs.map((item) => (
                                <div key={item.position} className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">
                                        Score {item.position}
                                    </label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            min="1"
                                            max="45"
                                            value={item.score}
                                            onChange={(e) =>
                                                handleScoreChange(
                                                    item.position,
                                                    e.target.value,
                                                )
                                            }
                                            error={errors[item.position]}
                                            placeholder="1-45"
                                            className={`text-center text-2xl font-bold h-24 ${
                                                item.score &&
                                                !errors[item.position]
                                                    ? "bg-primary-50 border-primary-300"
                                                    : ""
                                            }`}
                                        />
                                    </div>
                                    {errors[item.position] && (
                                        <p className="text-xs text-red-600">
                                            {errors[item.position]}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between items-center">
                        <p className="text-sm text-gray-600">
                            {allFilled
                                ? "✓ Ready for draw"
                                : `${5 - filledCount} more score(s) needed`}
                        </p>
                        <Button type="submit" loading={saveMutation.isPending}>
                            <Save className="h-4 w-4 mr-2" />
                            Save Scores
                        </Button>
                    </CardFooter>
                </Card>
            </form>

            <Card>
                <CardHeader>
                    <CardTitle>About Stableford Scoring</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600 space-y-2">
                    <p>
                        Stableford is a popular golf scoring system where points
                        are awarded based on your score relative to par for each
                        hole:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Double Eagle or better: 5 points</li>
                        <li>Eagle: 4 points</li>
                        <li>Birdie: 3 points</li>
                        <li>Par: 2 points</li>
                        <li>Bogey: 1 point</li>
                        <li>Double Bogey or worse: 0 points</li>
                    </ul>
                    <p className="mt-3">
                        Your total score can range from 0-45 points for an
                        18-hole round. Higher scores indicate better
                        performance.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
