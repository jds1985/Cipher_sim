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
// 1. SHARDED COLD BOOT (With Explicit UI Hook Streams)
// ==========================================
export async function bootCipherEngine(onStatusUpdate = () => {}) {
    if (session) {
        onStatusUpdate({ status: 'ready', msg: 'Substrate Active', progress: 100 });
        return session;
    }

    const ort = getGlobalOrt();
    if (!ort) {
        throw new Error("ONNX Runtime global script has not loaded in the browser context yet.");
    }

    try {
        onStatusUpdate({ status: 'loading_map', msg: 'Pulling Architecture Map...', progress: 10 });
        const modelUrl = '/models/model_quantized.onnx';

        // Signal the UI to switch on the loading wheel right before the heavy network stream ignites
        onStatusUpdate({ 
            status: 'streaming_shards', 
            msg: 'Streaming 4.83 GB Parameter Substrates (Active Background Sync)...', 
            progress: 15,
            showSpinner: true // Flag to turn on your loading wheel
        });

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
        
        onStatusUpdate({ status: 'ready', msg: 'Substrate Online', progress: 100, showSpinner: false });
        return session;
    } catch (err) {
        onStatusUpdate({ status: 'error', msg: 'Initialization Collapsed', progress: 0, showSpinner: false });
        console.error("❌ External data stream failed:", err);
        throw err;
    }
}

// ==========================================
// 2. INFERENCE LOOP
// ==========================================
export async function generateCipherResponse(promptText, onStatusUpdate = () => {}) {
    const activeSession = await bootCipherEngine(onStatusUpdate);
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
