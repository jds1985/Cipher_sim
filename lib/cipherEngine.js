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

async function checkShardsCached(db) {
    return new Promise((resolve) => {
        const transaction = db.transaction(["weights"], "readonly");
        const store = transaction.objectStore("weights");
        const request = store.get("shard_0"); // Check for baseline existence
        request.onsuccess = () => resolve(!!request.result);
        request.onerror = () => resolve(false);
    });
}

async function saveShardToStorage(db, key, buffer) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["weights"], "readwrite");
        const store = transaction.objectStore("weights");
        const request = store.put(buffer, key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

async function getStoredShard(db, key) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["weights"], "readonly");
        const store = transaction.objectStore("weights");
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// ==========================================
// AUTOMATED SANDBOX BOOT ENGINE
// ==========================================
export async function bootCipherEngine({ onProgress = () => {} } = {}) {
    if (session) {
        if (typeof onProgress === 'function') onProgress(100);
        return session;
    }

    const ort = getGlobalOrt();
    if (!ort) throw new Error("ONNX Runtime global script has not loaded yet.");

    try {
        if (typeof onProgress === 'function') onProgress(5);
        const modelUrl = '/models/model_quantized.onnx';
        const db = await openCipherDatabase();

        if (typeof onProgress === 'function') onProgress(15);
        console.log("🔍 Scanning local database matrix...");
        const limitsCleared = await checkShardsCached(db);

        const shardUrls = [
            'https://huggingface.co/Jds1985/cipher-substrate-weights/resolve/main/model_quantized.onnx.data.part0',
            'https://huggingface.co/Jds1985/cipher-substrate-weights/resolve/main/model_quantized.onnx.data.part1',
            'https://huggingface.co/Jds1985/cipher-substrate-weights/resolve/main/model_quantized.onnx.data.part2',
            'https://huggingface.co/Jds1985/cipher-substrate-weights/resolve/main/model_quantized.onnx.data.part3'
        ];

        // IF CACHE IS EMPTY, STREAM SHARDS SEQUENTIALLY STRAIGHT TO DISK
        if (!limitsCleared) {
            console.log("📥 Substrate database empty. Commencing stream-to-disk sequence...");
            if (typeof onProgress === 'function') onProgress("STREAMING_ACTIVE");

            for (let i = 0; i < shardUrls.length; i++) {
                console.log(`📥 Syncing segment shard_${i}...`);
                const response = await fetch(shardUrls[i]);
                if (!response.ok) throw new Error(`Network sync failed at position: ${i}`);
                
                const buffer = await response.arrayBuffer();
                const shardArray = new Uint8Array(buffer);
                
                // Save immediately to the database storage layer
                await saveShardToStorage(db, `shard_${i}`, shardArray);
                console.log(`💾 shard_${i} safely committed to database. Clearing heap...`);
            }
        } else {
            console.log("⚡ Found cached parameter segments. Reading matrix variables...");
            if (typeof onProgress === 'function') onProgress(60);
        }

        if (typeof onProgress === 'function') onProgress(80);
        
        // Reassemble the weights array out of the database for ONNX runtime allocation
        console.log("🧠 Assembling workspace parameters...");
        const parts = [];
        let totalSize = 0;
        for (let i = 0; i < shardUrls.length; i++) {
            const partData = await getStoredShard(db, `shard_${i}`);
            parts.push(partData);
            totalSize += partData.byteLength;
        }

        const unifiedWeights = new Uint8Array(totalSize);
        let offset = 0;
        for (const part of parts) {
            unifiedWeights.set(part, offset);
            offset += part.length;
        }

        if (typeof onProgress === 'function') onProgress(90);
        const modelResponse = await fetch(modelUrl);
        const modelBuffer = await modelResponse.arrayBuffer();

        console.log("🚀 Initializing WebGPU runtime layers...");
        session = await ort.InferenceSession.create(new Uint8Array(modelBuffer), {
            executionProviders: ['webgpu'],
            externalWeightsBuffers: [unifiedWeights]
        });

        if (typeof onProgress === 'function') onProgress(100);
        return session;
    } catch (err) {
        if (typeof onProgress === 'function') onProgress(0);
        console.error("❌ Sandbox boot protocol collapsed:", err);
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
