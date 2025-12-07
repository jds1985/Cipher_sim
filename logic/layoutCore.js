// Placeholder layout utilities
export function bubbleAlign(role) {
  return role === "user" ? "flex-end" : "flex-start";
}

export function bubbleColor(role, theme) {
  return role === "user" ? theme.userBubble : theme.cipherBubble;
}
