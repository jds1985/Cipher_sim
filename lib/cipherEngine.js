// Inside lib/cipherEngine.js

let session = null;
let tokenizer = null;

function getGlobalOrt() {
    if (typeof window !== 'undefined' && window.ort) {
        const globalOrt = window.ort;
        globalOrt.env.wasm.numThreads = 2;
        globalOrt.env.wasm.proxy = true; // Safe sandbox isolation
        return globalOrt;
    }
    return null;
}

// ==========================================
// 1. OFFICIAL SHARDED INITIALIZATION SEQUENCE
// ==========================================
export async function bootCipherEngine() {
    if (session) return session;
    console.log("🦅 Initializing decentralized substrate via official external data mapping...");

    const ort = getGlobalOrt();
    if (!ort) {
        throw new Error("ONNX Runtime global script has not loaded in the browser context yet.");
    }

    try {
        // Fetch the structural design map layout from Vercel public files
        const modelUrl = '/models/model_quantized.onnx';

        console.log("🧠 Constructing distributed external asset matrix...");

        // Standardized ONNX Runtime Web API for large distributed models
        session = await ort.InferenceSession.create(modelUrl, {
            executionProviders: ['webgpu'],
            preferredOutputLocation: 'gpu-buffer',
            externalData: [
                {
                    path: './model_quantized.onnx.data.part0',
                    data: 'https://huggingface.co/Jds1985/cipher-substrate-weights/resolve/main/model_quantized.onnx.data.part0'
                },
                {
                    path: './model_quantized.onnx.data.part1',
                    data: 'https://huggingface.co/Jds1985/cipher-substrate-weights/resolve/main/model_quantized.onnx.data.part1'
                },
                {
                    path: './model_quantized.onnx.data.part2',
                    data: 'https://huggingface.co/Jds1985/cipher-substrate-weights/resolve/main/model_quantized.onnx.data.part2'
                }
            ]
        });
        
        console.log("✅ Sharded substrate successfully mapped into phone WebGPU context.");
        return session;
    } catch (err) {
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
