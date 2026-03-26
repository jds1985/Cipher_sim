export function handleResponse(prevMessages, data, context) {
  const { isQuickAction, targetIndex } = context;

  const next = [...prevMessages];

  let finalOutput = "";

  if (data && data.nodeResult) {
    const d = data.nodeResult;

    finalOutput = `
💰 ROI: ${d.roi}%
📈 Monthly Cash Flow: $${d.monthlyCashFlow}
🏦 Annual Cash Flow: $${d.annualCashFlow}
💸 Expenses: $${d.monthlyExpenses}
⚠️ Risk: ${d.risk}
    `;
  } else {
    finalOutput = data.reply || "";
  }

  if (isQuickAction && targetIndex !== null) {
    next[targetIndex].content = finalOutput;
    next[targetIndex].transforming = false;
  } else {
    next[next.length - 1].content = finalOutput;
    next[next.length - 1].modelUsed = data.model || null;
    next[next.length - 1].memoryInfluence = data.memoryInfluence || [];
  }

  return next;
}
