// Inside lib/cipherEngine.js
import { AutoTokenizer } from '@huggingface/transformers';

let session = null;
let tokenizer = null;

// Safely pull the global 'ort' instance injected by the document script tag
function getGlobalOrt() {
    if (typeof window !== 'undefined' && window.ort) {
        const globalOrt = window.ort;
        globalOrt.env.wasm.numThreads = 1;
        globalOrt.env.wasm.proxy = false;
        return globalOrt;
    }
    return null;
}

// ==========================================
// 1. ENGINE COLD BOOT (Loads weights to GPU VRAM)
// ==========================================
export async function bootCipherEngine() {
    if (session) return session;
    console.log("🦅 Initializing decentralized substrate...");

    const ort = getGlobalOrt();
    if (!ort) {
        throw new Error("ONNX Runtime global script has not loaded in the browser context yet.");
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
// 2. INFERENCE LOOP (Fixed Tokenizer Instance)
// ==========================================
export async function generateCipherResponse(promptText) {
    const activeSession = await bootCipherEngine();
    const ort = getGlobalOrt();
    
    if (!tokenizer) {
        console.log("🗣️ Loading text translator vocabulary...");
        
        // FIXES THE 'e.replace is not a function' CRASH
        // Hard-locks the path string and bypasses local system resolution variables
        tokenizer = await AutoTokenizer.from_pretrained('Jds1985/cipher-substrate-weights', {
            local_files_only: false,
            revision: 'main'
        });
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
