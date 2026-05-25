// Inside lib/cipherEngine.js

let session = null;
let tokenizer = null;

function getGlobalOrt() {
    if (typeof window !== 'undefined' && window.ort) {
        const globalOrt = window.ort;
        globalOrt.env.wasm.numThreads = 1; 
        globalOrt.env.wasm.proxy = true; // Safe background sandbox thread isolation
        return globalOrt;
    }
    return null;
}

// ==========================================
// 1. ENGINE COLD BOOT (High-Priority Sequential Stream)
// ==========================================
export async function bootCipherEngine() {
    if (session) return session;
    console.log("🦅 Initializing decentralized substrate via prioritized streaming...");

    const ort = getGlobalOrt();
    if (!ort) {
        throw new Error("ONNX Runtime global script has not loaded in the browser context yet.");
    }

    try {
        const modelUrl = '/models/model_quantized.onnx';
        const modelResponse = await fetch(modelUrl);
        if (!modelResponse.ok) throw new Error("Failed to pull root architecture topology map.");
        const modelBuffer = await modelResponse.arrayBuffer();

        const shardUrls = [
            'https://huggingface.co/Jds1985/cipher-substrate-weights/resolve/main/model_quantized.onnx.data.part0',
            'https://huggingface.co/Jds1985/cipher-substrate-weights/resolve/main/model_quantized.onnx.data.part1',
            'https://huggingface.co/Jds1985/cipher-substrate-weights/resolve/main/model_quantized.onnx.data.part2',
            'https://huggingface.co/Jds1985/cipher-substrate-weights/resolve/main/model_quantized.onnx.data.part3'
        ];

        console.log("⏳ Fetching parameter chunks sequentially into background memory pools...");
        
        const weightsBuffers = [];
        let totalByteLength = 0;

        for (let i = 0; i < shardUrls.length; i++) {
            console.log(`📥 Streaming parameter segment ${i + 1} of ${shardUrls.length}...`);
            
            // PRIORITY UPDATE: Added keepalive and cors mode to protect mobile streaming data
            const response = await fetch(shardUrls[i], {
                method: 'GET',
                mode: 'cors',
                keepalive: true // Prevents the mobile OS from dropping the stream mid-download
            });
            
            if (!response.ok) throw new Error(`Network failure streaming parameters at slice: ${i}`);
            
            const buffer = await response.arrayBuffer();
            weightsBuffers.push(new Uint8Array(buffer));
            totalByteLength += buffer.byteLength;
        }

        console.log(`🧠 Weaving fragmented vectors into unified memory (${(totalByteLength / (1024*1024*1024)).toFixed(2)} GB)...`);

        const unifiedWeightsArray = new Uint8Array(totalByteLength);
        let currentByteOffset = 0;
        
        for (const shardArray of weightsBuffers) {
            unifiedWeightsArray.set(shardArray, currentByteOffset);
            currentByteOffset += shardArray.length;
        }

        console.log("🚀 Mapping compiled parameter block straight into local WebGPU VRAM context...");

        session = await ort.InferenceSession.create(new Uint8Array(modelBuffer), {
            executionProviders: ['webgpu'],
            preferredOutputLocation: 'gpu-buffer',
            externalWeightsBuffers: [unifiedWeightsArray]
        });
        
        console.log("✅ Cipher Substrate successfully loaded into phone GPU VRAM context.");
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
