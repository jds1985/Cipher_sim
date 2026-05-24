// Inside lib/cipherEngine.js
import { AutoTokenizer } from '@huggingface/transformers';

let session = null;
let tokenizer = null;
let ortInstance = null;

// Helper to resolve the true client-side ORT instance
async function getOrt() {
    if (ortInstance) return ortInstance;
    if (typeof window !== 'undefined') {
        const rawModule = await import('onnxruntime-web');
        // Handle Next.js dynamic module wrapping safely
        ortInstance = rawModule.default ? rawModule.default : rawModule;
        
        ortInstance.env.wasm.numThreads = 1;
        ortInstance.env.wasm.proxy = false;
        return ortInstance;
    }
    throw new Error("Cannot access ONNX Runtime outside the browser browser context.");
}

// ==========================================
// 1. ENGINE COLD BOOT (Loads weights to GPU VRAM)
// ==========================================
export async function bootCipherEngine() {
    if (session) return session;
    console.log("🦅 Initializing decentralized substrate...");

    const ort = await getOrt();

    try {
        const modelUrl = '/models/model_quantized.onnx';
        
        session = await ort.InferenceSession.create(modelUrl, {
            executionProviders: ['webgpu'],
            preferredOutputLocation: 'gpu-buffer',
            externalWeightsUrl: 'https://huggingface.co/Jds1985/cipher-substrate-weights/resolve/main/model_quantized.onnx.data'
        });
        
        console.log("✅ Cipher Substrate successfully loaded into phone GPU VRAM.");
        return session;
    } catch (err) {
        console.error("❌ Substrate initialization failed:", err);
        throw err;
    }
}

// ==========================================
// 2. INFERENCE LOOP (Translates, processes & decodes chat)
// ==========================================
export async function generateCipherResponse(promptText) {
    const activeSession = await bootCipherEngine();
    const ort = await getOrt();
    
    if (!tokenizer) {
        console.log("🗣️ Loading text translator vocabulary...");
        tokenizer = await AutoTokenizer.from_pretrained('Jds1985/cipher-substrate-weights');
    }

    console.log("🧠 Processing input token vectors...");
    
    const { input_ids } = await tokenizer(promptText);

    const modelInputs = {
        input_ids: new ort.Tensor('int64', BigInt64Array.from(input_ids.data.map(BigInt)), input_ids.dims)
    };

    const output = await activeSession.run(modelInputs);
    
    const responseTokens = output.logits.data; 
    const readableText = tokenizer.decode(responseTokens);

    return readableText;
}
