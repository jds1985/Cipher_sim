async function send() {  
  const input = document.getElementById("input");  
  const text = input.value;  
  if (!text.trim()) return;  
  
  const chatBox = document.getElementById("messages");  
  chatBox.innerHTML += `<div class='message user'><b>You:</b> ${text}</div>`;  

  try {
    const res = await fetch("https://cipher-sim.onrender.com/chat", {  // Your live backend URL
      method: "POST",  
      headers: { "Content-Type": "application/json" },  
      body: JSON.stringify({ prompt: text })  
    });  

    if (!res.ok) {
      throw new Error(`Server error: ${res.status}`);
    }

    const data = await res.json();  
    chatBox.innerHTML += `<div class='message cipher'><b>⚡ Cipher:</b> ${data.response}</div>`;  
  } catch (err) {
    console.error(err);
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
