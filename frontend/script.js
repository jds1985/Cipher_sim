async function send() {
  const input = document.getElementById("input");
  const text = input.value;
  if (!text.trim()) return;

  const chatBox = document.getElementById("messages");
  chatBox.innerHTML += `<div class='message user'><b>You:</b> ${text}</div>`;

  const res = await fetch("https://cipher-api.onrender.com/chat", {  // <-- replace with your real backend URL
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: text })
  });

  const data = await res.json();
  chatBox.innerHTML += `<div class='message cipher'><b>⚡ Cipher:</b> ${data.response}</div>`;

  input.value = "";
  chatBox.scrollTop = chatBox.scrollHeight;
}
