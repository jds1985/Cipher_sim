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
// 1. ENGINE COLD BOOT (Native ONNX Shard Stream with Progress Callback Tracking)
// ==========================================
export async function bootCipherEngine(onProgress = () => {}) {
    if (session) {
        onProgress(100);
        return session;
    }

    const ort = getGlobalOrt();
    if (!ort) {
        throw new Error("ONNX Runtime global script has not loaded in the browser context yet.");
    }

    try {
        onProgress(12); // Parsing model schema files
        const modelUrl = '/models/model_quantized.onnx';

        // Trigger our custom string state identifier to activate the frontend UI spinner
        onProgress("STREAMING_ACTIVE");

        // Standardized ONNX Runtime Web API for loading models across separate cloud shards
        session = await ort.InferenceSession.create(modelUrl, {
            executionProviders: ['webgpu'],
            externalData: [
                {
                    path: 'model_quantized.onnx.data.part0',
                    data: 'https://huggingface.co/Jds1985/cipher-substrate-weights/resolve/main/model_quantized.onnx.data.part0'
                },
                {
                    path: 'model_quantized.onnx.data.part1',
                    data: 'https://huggingface.co/Jds1985/cipher-substrate-weights/resolve/main/model_quantized.onnx.data.part1'
                },
                {
                    path: 'model_quantized.onnx.data.part2',
                    data: 'https://huggingface.co/Jds1985/cipher-substrate-weights/resolve/main/model_quantized.onnx.data.part2'
                },
                {
                    path: 'model_quantized.onnx.data.part3',
                    data: 'https://huggingface.co/Jds1985/cipher-substrate-weights/resolve/main/model_quantized.onnx.data.part3'
                }
            ]
        });
        
        onProgress(100);
        return session;
    } catch (err) {
        onProgress(0);
        console.error("❌ External allocation sequence collapsed:", err);
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
