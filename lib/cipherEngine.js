let cipherPipeline = null;

/**
 * Downloads and caches your raw ternary model weights straight into the user's browser.
 * Loads the core library engine directly via a universal global browser distribution layer.
 */
export async function initializeCipher(onProgressCallback) {
  if (cipherPipeline) return cipherPipeline;

  // Next.js SSR Guard: Prevent loading WebGPU code on Vercel's backend servers during builds
  if (typeof window === "undefined") return null;

  console.log("Initializing local sovereign substrate...");

  try {
    // 🌐 Dynamic Client-Side Universal Script Injection
    // Pulls the global browser build directly to bypass mobile module scoping restrictions
    if (typeof window !== "undefined" && !window.pipeline && !window.transformers) {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        // Using the compiled global browser distribution file
        script.src = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.1/dist/transformers.js";
        script.onload = () => resolve();
        script.onerror = (err) => reject(err);
        document.head.appendChild(script);
      });
    }

    // Capture the global framework object from the window layer
    const hfGlobal = typeof window !== "undefined" ? (window.transformers || window) : null;
    const pipeline = hfGlobal ? hfGlobal.pipeline : null;

    if (!pipeline) {
      throw new Error("Core pipeline object not found on global window execution context.");
    }

    cipherPipeline = await pipeline('text-generation', 'Jds1985/cipher-substrate-weights', {
      device: 'webgpu', // Hands the math directly to their phone/computer graphics chip
      dtype: 'q4',      // Enforces a light, compressed 4-bit memory footprint on device
      extraHeaders: {
        // Securely reads your read-only authentication token from your Vercel deployment env
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_HF_TOKEN}`
      },
      progress_callback: (progress) => {
        if (onProgressCallback && progress.status === 'progress') {
          // Updates your UI with the live download percentage
          onProgressCallback(Math.round(progress.loaded / progress.total * 100));
        }
      }
    });

    console.log("Cipher substrate successfully initialized on-device.");
    return cipherPipeline;
  } catch (error) {
    console.error("Failed to boot local execution engine:", error);
    throw error;
  }
}

/**
 * Runs the text loop entirely offline in the browser.
 */
export async function generateResponse(prompt, onTokenCallback) {
  if (!cipherPipeline) {
    throw new Error("Cipher engine has not been initialized yet.");
  }

  const output = await cipherPipeline(prompt, {
    max_new_tokens: 150,
    temperature: 0.7,
    stream: true,
    callback_function: (generation) => {
      if (onTokenCallback) {
        onTokenCallback(generation[0].text); // Streams character tokens live to the UI state
      }
    }
  });

  return output;
}
