export const INTERNAL_NODES = {
  real_estate_simple_v2: async (input) => {
  let { price, monthlyRent, monthlyExpenses } = input;

  // 🧠 Normalize price (250 → 250000)
  if (price && price < 1000) {
    price = price * 1000;
  }

  const monthlyCashFlow = monthlyRent - monthlyExpenses;
  const annualCashFlow = monthlyCashFlow * 12;

  const roi = price
    ? Number(((annualCashFlow / price) * 100).toFixed(2))
    : 0;

  const expenseRatio = monthlyRent
    ? Math.round((monthlyExpenses / monthlyRent) * 100)
    : 0;

  let risk = "low";
  if (expenseRatio > 60) risk = "high";
  else if (expenseRatio > 40) risk = "medium";

  return {
    price,
    monthlyRent,
    monthlyExpenses,
    monthlyCashFlow,
    annualCashFlow,
    roi,
    expenseRatio,
    risk,
  };
}
    console.log("📥 NODE INPUT:", input);
    console.log("🔥 V2 NODE ACTIVE 🔥");
    const price = Number(input?.price || 0);
    const rent = Number(input?.monthlyRent || 0);
    const expenses = Number(input?.monthlyExpenses || 0);

    if (!price || !rent) {
      throw new Error("MISSING_PRICE_OR_RENT");
    }

    const monthlyCashFlow = rent - expenses;
    const annualCashFlow = monthlyCashFlow * 12;

    // ✅ FIXED ROI
    const roi = price > 0
      ? Number(((annualCashFlow / price) * 100).toFixed(2))
      : 0;

    // ✅ NEW: expense ratio
    const expenseRatio = rent > 0
      ? Number(((expenses / rent) * 100).toFixed(1))
      : 0;

    // ✅ BASIC assumption (all cash deal)
    const monthlyPayment = 0;
    const estimatedCashNeeded = price;

    // ✅ better risk logic
    let risk = "high";
    if (roi >= 10 && expenseRatio < 50) risk = "low";
    else if (roi >= 5) risk = "medium";

    return {
      output: {
        price,
        monthlyRent: rent,
        monthlyExpenses: expenses,
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
