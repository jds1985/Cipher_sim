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

// DUAL-BOOT ENGINE: Processes physical device files instantly OR falls back to network urls
export async function bootCipherEngine(localShardFiles = null, onProgress = () => {}) {
    if (session) {
        onProgress(100);
        return session;
    }

    const ort = getGlobalOrt();
    if (!ort) throw new Error("ONNX Runtime global script has not initialized yet.");

    try {
        onProgress(5);
        const modelUrl = '/models/model_quantized.onnx';

        // PATH A: Direct physical file injection from your device storage
        if (localShardFiles && localShardFiles.length > 0) {
            onProgress("PROCESSING_LOCAL_SHARDS");
            console.log("⚡ Ingesting local weight matrices straight from device storage...");

            const sortedFiles = Array.from(localShardFiles).sort((a, b) => a.name.localeCompare(b.name));
            const weightsBuffers = [];
            let totalByteLength = 0;

            for (const file of sortedFiles) {
                const buffer = await file.arrayBuffer();
                weightsBuffers.push(new Uint8Array(buffer));
                totalByteLength += buffer.byteLength;
            }

            console.log(`🧠 Reconstructing parameter layout from ${sortedFiles.length} shards...`);
            const unifiedWeightsArray = new Uint8Array(totalByteLength);
            let currentByteOffset = 0;
            for (const shardArray of weightsBuffers) {
                unifiedWeightsArray.set(shardArray, currentByteOffset);
                currentByteOffset += shardArray.length;
            }

            onProgress(85);
            const modelResponse = await fetch(modelUrl);
            const modelBuffer = await modelResponse.arrayBuffer();

            session = await ort.InferenceSession.create(new Uint8Array(modelBuffer), {
                executionProviders: ['webgpu'],
                externalWeightsBuffers: [unifiedWeightsArray]
            });

            onProgress(100);
            return session;
        }

        // PATH B: Fallback network stream
        onProgress("STREAMING_ACTIVE");
        session = await ort.InferenceSession.create(modelUrl, {
            executionProviders: ['webgpu'],
            externalData: [
                { path: 'model_quantized.onnx.data.part0', data: 'https://huggingface.co/Jds1985/cipher-substrate-weights/resolve/main/model_quantized.onnx.data.part0' },
                { path: 'model_quantized.onnx.data.part1', data: 'https://huggingface.co/Jds1985/cipher-substrate-weights/resolve/main/model_quantized.onnx.data.part1' },
                { path: 'model_quantized.onnx.data.part2', data: 'https://huggingface.co/Jds1985/cipher-substrate-weights/resolve/main/model_quantized.onnx.data.part2' },
                { path: 'model_quantized.onnx.data.part3', data: 'https://huggingface.co/Jds1985/cipher-substrate-weights/resolve/main/model_quantized.onnx.data.part3' }
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
