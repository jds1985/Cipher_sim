// Inside engine/cipherEngine.js

export async function bootCipherEngine() {
    if (session) return session;
    console.log("🦅 Initializing decentralized substrate...");

    try {
        // The lightweight map stays on your Vercel site
        const modelUrl = '/models/model_quantized.onnx';
        
        session = await ort.InferenceSession.create(modelUrl, {
            executionProviders: ['webgpu'],
            preferredOutputLocation: 'gpu-buffer',
            // Tell the loader exactly where to fetch the heavy 4.83 GB weights payload 
            // from an external storage link instead of your local Vercel server
            externalWeightsUrl: 'https://huggingface.co/Jds1985/cipher-substrate-weights/resolve/main/onnx/model_quantized.onnx.data'
        });
        
        console.log("✅ Cipher Substrate successfully loaded into phone GPU VRAM.");
        return session;
    } catch (err) {
        console.error("❌ Substrate initialization failed:", err);
        throw err;
    }
}
