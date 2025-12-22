function generateAgents(count, intent, context) {
  const roles = [
    "Planner",
    "Builder",
    "Refactorer",
    "Validator",
    "Reviewer",
  ];

  return roles.slice(0, count).map(role => ({
    role,
    intent,
    context,
    rules: [
      "No file writes",
      "No external libraries",
      "Return suggestions or code only",
      "Terminate after response",
    ],
  }));
}