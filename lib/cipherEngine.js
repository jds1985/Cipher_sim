// Inside lib/cipherEngine.js

let session = null;
let tokenizer = null;

function getGlobalOrt() {
    if (typeof window !== 'undefined' && window.ort) {
        const globalOrt = window.ort;
        globalOrt.env.wasm.numThreads = 2; 
        globalOrt.env.wasm.proxy = true;   
        return globalOrt;
    }
    return null;
}

// ==========================================
// 1. ENGINE COLD BOOT (Independent Splice Matrix)
// ==========================================
export async function bootCipherEngine() {
    if (session) return session;
    console.log("🦅 Initializing decentralized substrate via sharded streaming blocks...");

    const ort = getGlobalOrt();
    if (!ort) {
        throw new Error("ONNX Runtime global script has not loaded in the browser context yet.");
    }

    try {
        // Pull the lightweight model architecture layout file from your Vercel public directory
        const modelUrl = '/models/model_quantized.onnx';
        const modelResponse = await fetch(modelUrl);
        if (!modelResponse.ok) throw new Error("Failed to pull root architecture topology map.");
        const modelBuffer = await modelResponse.arrayBuffer();

        // Shard URLs matching the parts you are downloading right now
        const shardUrls = [
            'https://huggingface.co/Jds1985/cipher-substrate-weights/resolve/main/model_quantized.onnx.data.part0',
            'https://huggingface.co/Jds1985/cipher-substrate-weights/resolve/main/model_quantized.onnx.data.part1',
            'https://huggingface.co/Jds1985/cipher-substrate-weights/resolve/main/model_quantized.onnx.data.part2',
            'https://huggingface.co/Jds1985/cipher-substrate-weights/resolve/main/model_quantized.onnx.data.part3'
        ];

        console.log("⏳ Fetching parameter segments sequentially...");
        
        const weightsBuffers = [];
        for (let i = 0; i < shardUrls.length; i++) {
            console.log(`📥 Fetching chunk ${i + 1} of ${shardUrls.length}...`);
            const response = await fetch(shardUrls[i]);
            if (!response.ok) throw new Error(`Network failure streaming parameters at position: ${i}`);
            
            const buffer = await response.arrayBuffer();
            weightsBuffers.push(new Uint8Array(buffer));
        }

        console.log("🚀 Initializing WebGPU workspace context with array collection variables...");

        // Pass the independent chunk arrays directly to the multi-weights buffer block
        session = await ort.InferenceSession.create(new Uint8Array(modelBuffer), {
            executionProviders: ['webgpu'],
            preferredOutputLocation: 'gpu-buffer',
            externalWeightsBuffers: weightsBuffers // Bypasses monolithic allocation limitations
        });
        
        console.log("✅ Cipher Substrate successfully loaded into phone GPU VRAM.");
        return session;
    } catch (err) {
        console.error("❌ Segmented initialization protocol failed:", err);
        throw err;
    }
}

// ==========================================
// 2. INFERENCE LOOP
// ==========================================
export async function generateCipherResponse(promptText) {
    const activeSession = await bootCipherEngine();
    const ort = getGlobalOrt();
    
    if (!tokenizer) {
        const { AutoTokenizer } = await import('@huggingface/transformers');
        const configUrl = 'https://huggingface.co/Jds1985/cipher-substrate-weights/raw/main/tokenizer_config.json';
        const tokenizerJsonUrl = 'https://huggingface.co/Jds1985/cipher-substrate-weights/raw/main/tokenizer.json';
        
        try {
            const [configRes, jsonRes] = await Promise.all([fetch(configUrl), fetch(tokenizerJsonUrl)]);
            const configData = await configRes.json();
            const tokenizerJsonData = await jsonRes.json();
            
            tokenizer = await AutoTokenizer.from_pretrained('Jds1985/cipher-substrate-weights', {
                config: configData,
                tokenizer: tokenizerJsonData,
                local_files_only: false
            });
        } catch (vocabErr) {
            tokenizer = await AutoTokenizer.from_pretrained('Jds1985/cipher-substrate-weights');
        }
    }

    const { input_ids } = await tokenizer(promptText);
    const modelInputs = {
        input_ids: new ort.Tensor('int64', BigInt64Array.from(input_ids.data.map(BigInt)), input_ids.dims)
    };

    const output = await activeSession.run(modelInputs);
    const responseTokens = output.logits.data; 
    const readableText = tokenizer.decode(responseTokens);

    return readableText;
}
