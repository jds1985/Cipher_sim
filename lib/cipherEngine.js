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

// MONOLITHIC ENGINE BOOT: Ingests the single massive 4.83 GB file directly from disk
export async function bootCipherEngine(localDataFile = null, onProgress = () => {}) {
    if (session) {
        onProgress(100);
        return session;
    }

    const ort = getGlobalOrt();
    if (!ort) throw new Error("ONNX Runtime global script has not initialized yet.");

    try {
        onProgress(10);
        const modelUrl = '/models/model_quantized.onnx';

        // Direct ingestion of the single full weights file from your phone storage
        if (localDataFile) {
            onProgress("PROCESSING_LOCAL_SHARDS"); // Keeps UI loading state cohesive
            console.log("⚡ Ingesting monolithic weight substrate from device storage...");

            // Read the single massive binary block directly into memory
            const buffer = await localDataFile.arrayBuffer();
            const unifiedWeights = new Uint8Array(buffer);

            onProgress(70);
            console.log("🧠 Mapping topology matrix...");
            const modelResponse = await fetch(modelUrl);
            const modelBuffer = await modelResponse.arrayBuffer();

            onProgress(90);
            session = await ort.InferenceSession.create(new Uint8Array(modelBuffer), {
                executionProviders: ['webgpu'],
                externalWeightsBuffers: [unifiedWeights]
            });

            onProgress(100);
            return session;
        }

        // Fallback network stream if no file is selected
        onProgress("STREAMING_ACTIVE");
        session = await ort.InferenceSession.create(modelUrl, {
            executionProviders: ['webgpu'],
            externalData: [
                { path: 'model_quantized.onnx.data', data: 'https://huggingface.co/Jds1985/cipher-substrate-weights/resolve/main/model_quantized.onnx.data' }
            ]
        });

        onProgress(100);
        return session;
    } catch (err) {
        onProgress(0);
        throw err;
    }
}

export async function generateCipherResponse(promptText) {
    const activeSession = await bootCipherEngine();
    const ort = getGlobalOrt();
    
    if (!tokenizer) {
        const { AutoTokenizer } = await import('@huggingface/transformers');
        try {
            const [configRes, jsonRes] = await Promise.all([
                fetch('https://huggingface.co/Jds1985/cipher-substrate-weights/raw/main/tokenizer_config.json'),
                fetch('https://huggingface.co/Jds1985/cipher-substrate-weights/raw/main/tokenizer.json')
            ]);
            tokenizer = await AutoTokenizer.from_pretrained('Jds1985/cipher-substrate-weights', {
                config: await configRes.json(),
                tokenizer: await jsonRes.json(),
                local_files_only: false
            });
        } catch (e) {
            tokenizer = await AutoTokenizer.from_pretrained('Jds1985/cipher-substrate-weights');
        }
    }

    const { input_ids } = await tokenizer(promptText);
    const modelInputs = {
        input_ids: new ort.Tensor('int64', BigInt64Array.from(input_ids.data.map(BigInt)), input_ids.dims)
    };

    const output = await activeSession.run(modelInputs);
    return tokenizer.decode(output.logits.data);
}
