// cipher_os/ciphernet/internalNodes.js

export const INTERNAL_NODES = {
  real_estate_simple_v1: async ({ input }) => {
    const price = Number(input?.price || 0);
    const rent = Number(input?.monthlyRent || 0);
    const expenses = Number(input?.monthlyExpenses || 0);

    if (!price || !rent) {
      throw new Error("MISSING_PRICE_OR_RENT");
    }

    const monthlyCashFlow = rent - expenses;
    const annualCashFlow = monthlyCashFlow * 12;
    const roi = price > 0 ? (annualCashFlow / price) * 100 : 0;

    let risk = "high";
    if (roi >= 12) risk = "low";
    else if (roi >= 7) risk = "medium";

    return {
      output: {
        price,
        monthlyRent: rent,
        monthlyExpenses: expenses,
        monthlyCashFlow: Number(monthlyCashFlow.toFixed(2)),
        annualCashFlow: Number(annualCashFlow.toFixed(2)),
        roi: Number(roi.toFixed(2)),
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
