export function buildMonthlyDrawPayload(now = new Date()) {
    const drawDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const year = drawDate.getFullYear();
    const month = String(drawDate.getMonth() + 1).padStart(2, "0");
    const day = String(drawDate.getDate()).padStart(2, "0");

    return {
        draw_date: `${year}-${month}-${day}`,
        numbers: [],
        prize_pool: 0,
        five_match_prize: 0,
        four_match_prize: 0,
        three_match_prize: 0,
        charity_amount: 0,
        status: "pending",
    };
}

export function formatDrawsForExport(draws = []) {
    return draws.map((draw) => ({
        id: draw.id,
        draw_date: draw.draw_date,
        numbers: Array.isArray(draw.numbers) ? draw.numbers.join("|") : "",
        prize_pool: draw.prize_pool,
        five_match_prize: draw.five_match_prize,
        four_match_prize: draw.four_match_prize,
        three_match_prize: draw.three_match_prize,
        charity_amount: draw.charity_amount,
        status: draw.status,
        created_at: draw.created_at,
    }));
}
