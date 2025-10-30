async function send() {  
  const input = document.getElementById("input");  
  const text = input.value;  
  if (!text.trim()) return;  

  const chatBox = document.getElementById("messages");  
  chatBox.innerHTML += `<div class='message user'><b>You:</b> ${text}</div>`;  

  console.log("🚀 Sending message to Cipher:", text);

  try {
    const res = await fetch("https://cipher-sim.onrender.com/chat", {  // Your backend URL
      method: "POST",  
      headers: { "Content-Type": "application/json" },  
      body: JSON.stringify({ prompt: text })  
    });  

    console.log("📡 Response status:", res.status);

    if (!res.ok) {
      throw new Error(`Server error: ${res.status}`);
    }

    const data = await res.json();  
    console.log("💬 Cipher replied with:", data);

    if (data.response) {
      chatBox.innerHTML += `<div class='message cipher'><b>⚡ Cipher:</b> ${data.response}</div>`;  
    } else {
      chatBox.innerHTML += `<div class='message error'><b>⚠️ Cipher:</b> (No response received)</div>`;
      console.warn("⚠️ Cipher returned an empty response object:", data);
    }
  } catch (err) {
    console.error("❌ Fetch error:", err);
    chatBox.innerHTML += `<div class='message error'><b>⚠️ Error:</b> Unable to reach Cipher. Please try again.</div>`;
  }

  input.value = "";  
  chatBox.scrollTop = chatBox.scrollHeight;  
}  

// Allow "Enter" key to send messages
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("input");
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") send();
  });
});
