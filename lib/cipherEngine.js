// Inside lib/cipherEngine.js

let session = null;
let tokenizer = null;

// Pull the global 'ort' instance injected by the document script tag safely
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
// 1. ENGINE COLD BOOT (Loads linked cloud parameters to GPU VRAM)
// ==========================================
export async function bootCipherEngine() {
    if (session) return session;
    console.log("🦅 Initializing decentralized substrate...");

    const ort = getGlobalOrt();
    if (!ort) {
        throw new Error("ONNX Runtime global script has not loaded in the browser context yet.");
    }

    try {
        // The core graph architecture structure file
        const modelUrl = 'https://huggingface.co/Jds1985/cipher-substrate-weights/resolve/main/model_quantized.onnx';
        
        session = await ort.InferenceSession.create(modelUrl, {
            executionProviders: ['webgpu'],
            preferredOutputLocation: 'gpu-buffer',
            // Explicitly map the heavy parameter chunk to completely fix the external file error
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
    const ort = getGlobalOrt();
    
    if (!tokenizer) {
        console.log("🗣️ Loading text translator vocabulary files directly...");
        
        const { AutoTokenizer } = await import('@huggingface/transformers');
        
        const configUrl = 'https://huggingface.co/Jds1985/cipher-substrate-weights/raw/main/tokenizer_config.json';
        const tokenizerJsonUrl = 'https://huggingface.co/Jds1985/cipher-substrate-weights/raw/main/tokenizer.json';
        
        try {
            const [configRes, jsonRes] = await Promise.all([
                fetch(configUrl),
                fetch(tokenizerJsonUrl)
            ]);
            
            const configData = await configRes.json();
            const tokenizerJsonData = await jsonRes.json();
            
            tokenizer = await AutoTokenizer.from_pretrained('Jds1985/cipher-substrate-weights', {
                config: configData,
                tokenizer: tokenizerJsonData,
                local_files_only: false
            });
        } catch (vocabErr) {
            console.warn("Direct JSON load failed, falling back to network fallback path...", vocabErr);
            tokenizer = await AutoTokenizer.from_pretrained('Jds1985/cipher-substrate-weights');
        }
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
