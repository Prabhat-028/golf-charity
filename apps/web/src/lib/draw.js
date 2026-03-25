export function generateDrawNumbers() {
    const numbers = [];

    while (numbers.length < 5) {
        const n = Math.floor(Math.random() * 45) + 1;
        if (!numbers.includes(n)) {
            numbers.push(n);
        }
    }

    return numbers.sort((a, b) => a - b);
}

export function calculateDrawAmounts(activeSubscribers, settings = {}) {
    const subscriberCount = Number(activeSubscribers || 0);

    const fivePct = Number(settings.five_match_pct ?? 40);
    const fourPct = Number(settings.four_match_pct ?? 35);
    const threePct = Number(settings.three_match_pct ?? 25);
    const charityPct = Number(settings.charity_pct ?? 10);

    const grossRevenue = subscriberCount * 10;
    const charityAmount = grossRevenue * (charityPct / 100);
    const prizePool = Math.max(grossRevenue - charityAmount, 0);

    return {
        grossRevenue,
        charityAmount,
        prizePool,
        fiveMatchPrize: prizePool * (fivePct / 100),
        fourMatchPrize: prizePool * (fourPct / 100),
        threeMatchPrize: prizePool * (threePct / 100),
    };
}
