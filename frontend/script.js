async function send() {  
  const input = document.getElementById("input");  
  const text = input.value;  
  if (!text.trim()) return;  

  const chatBox = document.getElementById("messages");  
  chatBox.innerHTML += `<div class='message user'><b>You:</b> ${text}</div>`;  
  chatBox.innerHTML += `<div class='message system'>📡 Sending message to Cipher...</div>`;

  try {
    const res = await fetch("https://cipher-sim.onrender.com/chat", {  
      method: "POST",  
      headers: { "Content-Type": "application/json" },  
      body: JSON.stringify({ prompt: text })  
    });  

    chatBox.innerHTML += `<div class='message system'>⚙️ Response status: ${res.status}</div>`;

    if (!res.ok) {
      throw new Error(`Server error: ${res.status}`);
    }

    const data = await res.json();  

    if (data && data.response) {
      chatBox.innerHTML += `<div class='message cipher'><b>⚡ Cipher:</b> ${data.response}</div>`;  
    } else {
      chatBox.innerHTML += `<div class='message error'><b>⚠️ Cipher:</b> No response received.</div>`;
      chatBox.innerHTML += `<div class='message system'>Debug Info: ${JSON.stringify(data)}</div>`;
    }
  } catch (err) {
    chatBox.innerHTML += `<div class='message error'><b>❌ Error:</b> ${err.message}</div>`;
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
