import { describe, expect, it } from "vitest";
import { buildCsvString } from "./csv";

describe("buildCsvString", () => {
    it("returns empty string for empty input", () => {
        expect(buildCsvString([])).toBe("");
    });

    it("builds csv with escaped values", () => {
        const csv = buildCsvString([
            {
                name: "Alice",
                note: 'He said "hello"',
                amount: 12.5,
            },
            {
                name: "Bob, Jr",
                note: "Line 1\nLine 2",
                amount: null,
            },
        ]);

        expect(csv).toContain("name,note,amount");
        expect(csv).toContain('Alice,"He said ""hello""",12.5');
        expect(csv).toContain('"Bob, Jr","Line 1\nLine 2",');
    });
});
