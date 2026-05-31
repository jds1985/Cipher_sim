// lib/cipherengine.js

let engineUrl = "http://localhost:8000"; // Default address when running locally on your laptop

/**
 * Updates the network location of the Cipher Python engine.
 * Useful when your phone needs to point to your laptop's specific local IP address (e.g., http://192.168.1.XX:8000)
 */
export function setCipherEngineAddress(customIpAddress) {
    engineUrl = customIpAddress;
    console.log(`📡 Cipher Engine target address updated to: ${engineUrl}`);
}

/**
 * Simplified boot sequence.
 * Instead of downloading gigabytes of files into the browser, it simply pings the local Python engine 
 * to make sure it's active and awake.
 */
export async function bootCipherEngine({ onProgress = () => {} } = {}) {
    try {
        if (typeof onProgress === 'function') {
            onProgress({ stage: "STARTING", pct: 20, msg: "Connecting to local hardware signal..." });
        }

        // Ping the health check endpoint on our Python script
        const response = await fetch(`${engineUrl}/`);
        if (!response.ok) throw new Error("Local engine did not respond safely.");
        
        const data = await response.json();
        console.log("🧠 Connected to Engine:", data);

        if (typeof onProgress === 'function') {
            onProgress({ stage: "READY", pct: 100, msg: "Sovereign Engine Online" });
        }
        return true;
    } catch (err) {
        if (typeof onProgress === 'function') {
            onProgress({ stage: "ERROR", pct: 0, msg: "Engine unreachable. Verify Python is running." });
        }
        console.error("❌ Link to backend engine failed:", err);
        return false;
    }
}

/**
 * Replaces the complex ONNX/Tokenizer loop.
 * It packages your prompt text neatly and posts it out to the local engine for processing.
 */
export async function generateCipherResponse(promptText) {
    console.log(`🚀 Routing prompt text down the local pipeline to: ${engineUrl}/v1/chat`);
    
    const response = await fetch(`${engineUrl}/v1/chat`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt: promptText })
    });

    if (!response.ok) {
        throw new Error(`Engine error: Failed to receive data stream. Status ${response.status}`);
    }

    const data = await response.json();
    
    // Extract the text content matching the structure returned by your Python script
    if (data.status === "success" && data.choices && data.choices[0].message) {
        return data.choices[0].message.content;
    }
    
    throw new Error("Unexpected data schema received from local engine.");
}
