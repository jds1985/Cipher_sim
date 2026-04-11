export async function runNode(node, input) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: `
${node.systemPrompt}

INPUT:
${JSON.stringify(input)}

Return ONLY the output in JSON format.
`
    })
  });

  const data = await res.json();
  return data;
}
