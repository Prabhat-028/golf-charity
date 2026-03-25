import { describe, expect, it } from "vitest";
import { buildMonthlyDrawPayload, formatDrawsForExport } from "./adminDraws";

describe("buildMonthlyDrawPayload", () => {
    it("creates pending draw payload using end of current month", () => {
        const payload = buildMonthlyDrawPayload(new Date(2026, 2, 10));

        expect(payload.draw_date).toBe("2026-03-31");
        expect(payload.status).toBe("pending");
        expect(payload.numbers).toEqual([]);
        expect(payload.prize_pool).toBe(0);
        expect(payload.charity_amount).toBe(0);
    });
});

describe("formatDrawsForExport", () => {
    it("formats draw rows for CSV export", () => {
        const rows = formatDrawsForExport([
            {
                id: "draw-1",
                draw_date: "2026-03-31",
                numbers: [1, 5, 9, 15, 22],
                prize_pool: 2500,
                five_match_prize: 1000,
                four_match_prize: 900,
                three_match_prize: 600,
                charity_amount: 300,
                status: "completed",
                created_at: "2026-03-01T00:00:00.000Z",
            },
        ]);

        expect(rows).toEqual([
            {
                id: "draw-1",
                draw_date: "2026-03-31",
                numbers: "1|5|9|15|22",
                prize_pool: 2500,
                five_match_prize: 1000,
                four_match_prize: 900,
                three_match_prize: 600,
                charity_amount: 300,
                status: "completed",
                created_at: "2026-03-01T00:00:00.000Z",
            },
        ]);
    });

    it("handles missing numbers array safely", () => {
        const rows = formatDrawsForExport([
            {
                id: "draw-2",
                draw_date: "2026-04-30",
                numbers: null,
                prize_pool: 0,
                five_match_prize: 0,
                four_match_prize: 0,
                three_match_prize: 0,
                charity_amount: 0,
                status: "pending",
                created_at: "2026-04-01T00:00:00.000Z",
            },
        ]);

        expect(rows[0].numbers).toBe("");
    });
});
