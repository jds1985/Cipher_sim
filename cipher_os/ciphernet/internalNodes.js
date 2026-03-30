export const INTERNAL_NODES = {
  real_estate_simple_v2: async (input) => {
    console.log("📥 NODE INPUT:", input);
    console.log("🔥 V2 NODE ACTIVE 🔥");

    let { price, monthlyRent, monthlyExpenses } = input || {};

    price = Number(price || 0);
    monthlyRent = Number(monthlyRent || 0);
    monthlyExpenses = Number(monthlyExpenses || 0);

    // 🧠 Normalize price (250 → 250000)
    if (price && price < 1000) {
      price = price * 1000;
    }

    if (!price || !monthlyRent) {
      throw new Error("MISSING_PRICE_OR_RENT");
    }

    const monthlyCashFlow = monthlyRent - monthlyExpenses;
    const annualCashFlow = monthlyCashFlow * 12;

    const roi = price > 0
      ? Number(((annualCashFlow / price) * 100).toFixed(2))
      : 0;

    const expenseRatio = monthlyRent > 0
      ? Math.round((monthlyExpenses / monthlyRent) * 100)
      : 0;

    const monthlyPayment = 0;
    const estimatedCashNeeded = price;

    let risk = "low";
    if (expenseRatio > 60) risk = "high";
    else if (expenseRatio > 40) risk = "medium";

    return {
      output: {
        price,
        monthlyRent,
        monthlyExpenses,
        monthlyCashFlow,
        annualCashFlow,
        roi,
        expenseRatio,
        monthlyPayment,
        estimatedCashNeeded,
        risk,
      },
    };
  },

  hello_node: async ({ input }) => {
    return {
      output: `Hello ${input?.name || "world"}`,
    };
  },
};
