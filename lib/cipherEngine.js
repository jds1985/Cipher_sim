// Inside lib/cipherEngine.js
import { AutoTokenizer } from '@huggingface/transformers';
import * as ort from 'onnxruntime-web';

let session = null;
let tokenizer = null;

export async function bootCipherEngine() {
    if (session) return session;
    console.log("🦅 Initializing decentralized substrate...");

    // FIX THE 'IMPORT.META' COMPILER ERROR: Tell ONNX to skip server-side compilation paths
    if (typeof window !== 'undefined') {
        ort.env.wasm.numThreads = 1;
        ort.env.wasm.proxy = false;
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
