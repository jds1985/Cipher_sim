let cipherPipeline = null;

/**
 * Downloads and caches your raw ternary model weights straight into the user's browser.
 * Uses a direct module script bridge to guarantee extraction on mobile viewports.
 */
export async function initializeCipher(onProgressCallback) {
  if (cipherPipeline) return cipherPipeline;

  if (typeof window === "undefined") return null;

  console.log("Initializing local sovereign substrate...");

  try {
    // 🌐 Dynamic Module Script Injection
    if (typeof window !== "undefined" && !window.transformersModule) {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.type = "module";
        script.textContent = `
          import { pipeline } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.1";
          window.transformersModule = { pipeline };
        `;
        script.onload = () => resolve();
        script.onerror = (err) => reject(err);
        document.head.appendChild(script);
      });
    }

    const pipeline = typeof window !== "undefined" && window.transformersModule ? window.transformersModule.pipeline : null;

    if (!pipeline) {
      throw new Error("Module injection completed, but pipeline bridge remains uninstantiated.");
    }

    // 🎯 Lock directly onto your root model.safetensors layout
    cipherPipeline = await pipeline('text-generation', 'Jds1985/cipher-substrate-weights', {
      device: 'webgpu', 
      dtype: 'fp16', // Maps exactly to your BF16 tensor layout over WebGPU
      file_names: {
        'model': 'model.safetensors' // Forces it to look directly for your exact filename
      },
      extraHeaders: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_HF_TOKEN}`
      },
      progress_callback: (progress) => {
        if (onProgressCallback && progress.status === 'progress') {
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
        onTokenCallback(generation[0].text); 
      }
    }
  });

  return output;
}
