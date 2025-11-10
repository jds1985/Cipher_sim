// /api/chat.js

document.addEventListener("DOMContentLoaded", () => {
  const input = document.querySelector("input");
  const sendBtn = document.querySelector("button");
  const replyDiv = document.querySelector("p");

  async function sendMessage() {
    const message = input.value.trim();

    if (!message) {
      replyDiv.textContent = "Please enter a message.";
      return;
    }

    replyDiv.textContent = "Cipher is thinking...";

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      if (!res.ok) {
        const text = await res.text();
        replyDiv.textContent = `Error: ${res.status} – ${text}`;
        return;
      }

      const data = await res.json();
      console.log("Cipher Response:", data);
      replyDiv.textContent = data.reply || "No reply received.";
    } catch (err) {
      console.error("Connection error:", err);
      replyDiv.textContent = "Error connecting to Cipher.";
    }

    input.value = "";
  }

  sendBtn.addEventListener("click", sendMessage);

  // allow Enter key
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });
});
