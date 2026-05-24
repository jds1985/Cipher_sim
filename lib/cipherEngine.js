// Inside lib/cipherEngine.js

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
// 1. ENGINE COLD BOOT (Hybrid In-Memory Buffer Bridge)
// ==========================================
export async function bootCipherEngine() {
    if (session) return session;
    console.log("🦅 Initializing decentralized substrate via hybrid binary streams...");

    const ort = getGlobalOrt();
    if (!ort) {
        throw new Error("ONNX Runtime global script has not loaded in the browser context yet.");
    }

    try {
        // Pull the skeleton layout file directly from your local public folder on Vercel
        const modelUrl = '/models/model_quantized.onnx';
        // Pull the heavy parameter payload directly from the Hugging Face Cloud
        const weightsUrl = 'https://huggingface.co/Jds1985/cipher-substrate-weights/resolve/main/model_quantized.onnx.data';

        console.log("⏳ Pulling local architecture maps and cloud parameter substrates into phone memory...");
        
        const [modelResponse, weightsResponse] = await Promise.all([
            fetch(modelUrl),
            fetch(weightsUrl)
        ]);

        if (!modelResponse.ok || !weightsResponse.ok) {
            throw new Error(`Asset fetch failed. Status: Local Model Map(${modelResponse.status}), Cloud Weights(${weightsResponse.status})`);
        }

        const modelBuffer = await modelResponse.arrayBuffer();
        const weightsBuffer = await weightsResponse.arrayBuffer();

        console.log("🧠 Splicing substrates and igniting local WebGPU context...");

        session = await ort.InferenceSession.create(new Uint8Array(modelBuffer), {
            executionProviders: ['webgpu'],
            preferredOutputLocation: 'gpu-buffer',
            externalWeightsBuffers: [new Uint8Array(weightsBuffer)]
        });
        
        console.log("✅ Cipher Substrate successfully loaded into phone GPU VRAM.");
        return session;
    } catch (err) {
        console.error("❌ Substrate initialization failed:", err);
        throw err;
    }
}

// ==========================================
// 2. INFERENCE LOOP (Bypasses Next.js Webpack String Scrambling)
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
