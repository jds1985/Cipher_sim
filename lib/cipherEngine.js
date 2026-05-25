let session = null;
let tokenizer = null;

function getGlobalOrt() {
    if (typeof window !== 'undefined' && window.ort) {
        const globalOrt = window.ort;
        globalOrt.env.wasm.numThreads = 1; 
        globalOrt.env.wasm.proxy = false; // Execute on main window context to bypass thread cloning limits
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
        const request = store.get("shard_0");
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

// Low-memory fetch stream tracking engine
async function fetchWithProgress(url, label, onPercentUpdate) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to download ${label}`);
    
    const contentLength = response.headers.get('content-length');
    if (!contentLength) {
        const buffer = await response.arrayBuffer();
        return new Uint8Array(buffer);
    }
    
    const totalBytes = parseInt(contentLength, 10);
    const reader = response.body.getReader();
    const chunks = [];
    let receivedBytes = 0;
    
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        chunks.push(value);
        receivedBytes += value.length;
        
        const percent = Math.round((receivedBytes / totalBytes) * 100);
        onPercentUpdate(percent);
    }
    
    const unifiedChunk = new Uint8Array(receivedBytes);
    let position = 0;
    for (const chunk of chunks) {
        unifiedChunk.set(chunk, position);
        position += chunk.length;
    }
    return unifiedChunk;
}

// ==========================================
// AUTOMATED ZERO-COPY BOOT ENGINE
// ==========================================
export async function bootCipherEngine({ onProgress = () => {} } = {}) {
    if (session) {
        if (typeof onProgress === 'function') onProgress({ stage: "READY", pct: 100, msg: "Sovereign Engine Online" });
        return session;
    }

    const ort = getGlobalOrt();
    if (!ort) throw new Error("ONNX Runtime global script has not loaded yet.");

    try {
        if (typeof onProgress === 'function') onProgress({ stage: "STARTING", pct: 5, msg: "Opening secure system database..." });
        const modelUrl = '/models/model_quantized.onnx';
        const db = await openCipherDatabase();

        const limitsCleared = await checkShardsCached(db);

        const shardUrls = [
            'https://huggingface.co/Jds1985/cipher-substrate-weights/resolve/main/model_quantized.onnx.data.part0',
            'https://huggingface.co/Jds1985/cipher-substrate-weights/resolve/main/model_quantized.onnx.data.part1',
            'https://huggingface.co/Jds1985/cipher-substrate-weights/resolve/main/model_quantized.onnx.data.part2',
            'https://huggingface.co/Jds1985/cipher-substrate-weights/resolve/main/model_quantized.onnx.data.part3'
        ];

        if (!limitsCleared) {
            console.log("📥 Substrate database empty. Commencing ordered download stream...");
            for (let i = 0; i < shardUrls.length; i++) {
                const shardArray = await fetchWithProgress(shardUrls[i], `Shard ${i+1}`, (shardPercent) => {
                    if (typeof onProgress === 'function') {
                        onProgress({ 
                            stage: `STREAMING_ACTIVE`, 
                            msg: `Syncing Substrate Part ${i + 1}/4... ${shardPercent}%`,
                            pct: Math.round(((i / shardUrls.length) * 100) + (shardPercent / shardUrls.length))
                        });
                    }
                });
                
                await saveShardToStorage(db, `shard_${i}`, shardArray);
                console.log(`💾 shard_${i} safely committed to database storage.`);
            }
        }

        if (typeof onProgress === 'function') onProgress({ stage: "COMPILING", pct: 85, msg: "Hydrating parameter variables..." });
        
        // 🔒 FIXED STAGE: Enforcing strict linear reassembly sequences via indexed loops
        console.log("🧠 Reconstructing network matrices in explicit sequential order...");
        const externalBuffers = [];
        
        // We use an explicit counter loop to ensure shard 0 through 3 line up perfectly in memory
        for (let i = 0; i < shardUrls.length; i++) {
            const shardData = await getStoredShard(db, `shard_${i}`);
            console.log(`✅ Shard position data block mapping confirmed at index placement: ${i}`);
            externalBuffers.push(shardData);
        }

        if (typeof onProgress === 'function') onProgress({ stage: "COMPILING", pct: 95, msg: "Mounting WebGPU acceleration matrix..." });
        const modelResponse = await fetch(modelUrl);
        const modelBuffer = await modelResponse.arrayBuffer();

        console.log("🚀 Initializing WebGPU engine natively using ordered standalone arrays...");
        
        // Map the zero-copy array layout cleanly to the ONNX Runtime initialization parameters
        session = await ort.InferenceSession.create(new Uint8Array(modelBuffer), {
            executionProviders: ['webgpu'],
            externalWeightsBuffers: externalBuffers
        });

        if (typeof onProgress === 'function') onProgress({ stage: "READY", pct: 100, msg: "Sovereign Engine Online" });
        return session;
    } catch (err) {
        if (typeof onProgress === 'function') onProgress({ stage: "ERROR", pct: 0, msg: "Initialization collapsed" });
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
