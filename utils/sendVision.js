// utils/sendVision.js
export async function sendVisionToCipher(imageDataUrl, memory = "") {
  try {
    const response = await fetch("/api/vision_chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image: imageDataUrl,
        prompt: "Analyze this image as Cipher.",
        memory,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Vision API error:", data);
      return "Sorry Jim, I couldn't analyze that image.";
    }

    return data.reply || "I'm not sure what that is, Jim.";
  } catch (err) {
    console.error("Vision send failed:", err);
    return "Error: Cipher's vision pipeline crashed.";
  }
}
