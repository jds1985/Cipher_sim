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
// PERSISTENT INDEXEDDB BUFFER STORAGE CACHE
// ==========================================
async function openCipherDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("CipherSubstrateStorage", 1);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains("weights")) {
                db.createObjectStore("weights");
            }
        };
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
    });
}

async function getStoredWeights(db, key) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["weights"], "readonly");
        const store = transaction.objectStore("weights");
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function saveWeightsToStorage(db, key, buffer) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["weights"], "readwrite");
        const store = transaction.objectStore("weights");
        const request = store.put(buffer, key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// ==========================================
// AUTOMATED SANDBOX BOOT ENGINE
// ==========================================
export async function bootCipherEngine(onProgress = () => {}) {
    if (session) {
        onProgress(100);
        return session;
    }

    const ort = getGlobalOrt();
    if (!ort) throw new Error("ONNX Runtime global script has not loaded yet.");

    try {
        onProgress(5);
        const modelUrl = '/models/model_quantized.onnx';
        const db = await openCipherDatabase();

        onProgress(15);
        console.log("🔍 Scanning local persistent database matrix...");
        let unifiedWeights = await getStoredWeights(db, "substrate_matrix");

        // IF THE MODEL IS NOT CACHED YET, STREAM IN SMALL CHUNKS AND COMMIT TO DISK
        if (!unifiedWeights) {
            console.log("📥 Substrate cache empty. Commencing direct sharded network streaming sync...");
            onProgress("STREAMING_ACTIVE");

            const shardUrls = [
                'https://huggingface.co/Jds1985/cipher-substrate-weights/resolve/main/model_quantized.onnx.data.part0',
                'https://huggingface.co/Jds1985/cipher-substrate-weights/resolve/main/model_quantized.onnx.data.part1',
                'https://huggingface.co/Jds1985/cipher-substrate-weights/resolve/main/model_quantized.onnx.data.part2',
                'https://huggingface.co/Jds1985/cipher-substrate-weights/resolve/main/model_quantized.onnx.data.part3'
            ];

            const weightsBuffers = [];
            let totalByteLength = 0;

            // Sequential fetch loop to stay safely within mobile memory boundaries
            for (let i = 0; i < shardUrls.length; i++) {
                console.log(`📥 Fetching shard segment ${i + 1} of ${shardUrls.length}...`);
                const response = await fetch(shardUrls[i]);
                if (!response.ok) throw new Error(`Network sync failed at shard block position: ${i}`);
                const buffer = await response.arrayBuffer();
                weightsBuffers.push(new Uint8Array(buffer));
                totalByteLength += buffer.byteLength;
            }

            console.log("🧠 Reassembling weights inside app sandbox environment...");
            unifiedWeights = new Uint8Array(totalByteLength);
            let currentOffset = 0;
            for (const shard of weightsBuffers) {
                unifiedWeights.set(shard, currentOffset);
                currentOffset += shard.length;
            }

            console.log("💾 Committing weights permanently into secure local storage database...");
            await saveWeightsToStorage(db, "substrate_matrix", unifiedWeights);
        } else {
            console.log("⚡ Found cached parameter matrix! Loading instantly from internal hardware database...");
            onProgress(60);
        }

        onProgress(85);
        const modelResponse = await fetch(modelUrl);
        const modelBuffer = await modelResponse.arrayBuffer();

        console.log("🚀 Initializing WebGPU framework core...");
        session = await ort.InferenceSession.create(new Uint8Array(modelBuffer), {
            executionProviders: ['webgpu'],
            externalWeightsBuffers: [unifiedWeights]
        });

        onProgress(100);
        return session;
    } catch (err) {
        onProgress(0);
        console.error("❌ Sandbox boot protocol collapsed:", err);
        throw err;
    }
}

export async function generateCipherResponse(promptText) {
    const activeSession = await bootCipherEngine(() => {});
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
