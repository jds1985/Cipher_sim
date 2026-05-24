// Inside lib/cipherEngine.js
import { AutoTokenizer } from '@huggingface/transformers';

let session = null;
let tokenizer = null;
let ort = null;

// ==========================================
// 1. ENGINE COLD BOOT (Loads weights to GPU VRAM)
// ==========================================
export async function bootCipherEngine() {
    if (session) return session;
    console.log("🦅 Initializing decentralized substrate...");

    // Safe dynamic loading wrapper for client-side environments
    if (typeof window !== 'undefined') {
        if (!ort) {
            ort = await import('onnxruntime-web');
        }
        ort.env.wasm.numThreads = 1;
        ort.env.wasm.proxy = false;
    } else {
        throw new Error("Cannot boot local graphics engine on server side.");
    }

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
