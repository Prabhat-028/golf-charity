import { describe, expect, it } from "vitest";
import { calculateDrawAmounts, generateDrawNumbers } from "./draw";

describe("generateDrawNumbers", () => {
    it("returns 5 unique sorted numbers between 1 and 45", () => {
        const numbers = generateDrawNumbers();

        expect(numbers).toHaveLength(5);
        expect(new Set(numbers).size).toBe(5);
        expect(numbers.every((n) => n >= 1 && n <= 45)).toBe(true);

        const sorted = [...numbers].sort((a, b) => a - b);
        expect(numbers).toEqual(sorted);
    });
});

describe("calculateDrawAmounts", () => {
    it("calculates default allocations from subscriber count", () => {
        const result = calculateDrawAmounts(100);

        expect(result.grossRevenue).toBe(1000);
        expect(result.charityAmount).toBe(100);
        expect(result.prizePool).toBe(900);
        expect(result.fiveMatchPrize).toBe(360);
        expect(result.fourMatchPrize).toBe(315);
        expect(result.threeMatchPrize).toBe(225);
    });

    it("supports custom settings", () => {
        const result = calculateDrawAmounts(50, {
            charity_pct: 20,
            five_match_pct: 50,
            four_match_pct: 30,
            three_match_pct: 20,
        });

        expect(result.grossRevenue).toBe(500);
        expect(result.charityAmount).toBe(100);
        expect(result.prizePool).toBe(400);
        expect(result.fiveMatchPrize).toBe(200);
        expect(result.fourMatchPrize).toBe(120);
        expect(result.threeMatchPrize).toBe(80);
    });
});
