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

// Helper function to safely update your glass panel status text directly in the DOM
function updateTerminalDOM(message, progressPercentage, activeLoading = false) {
    if (typeof document === 'undefined') return;
    
    // Attempt to locate your existing progress indicator text matching your UI screenshot layout
    const elements = document.querySelectorAll('div, span, p, button');
    elements.forEach(el => {
        if (el.textContent && el.textContent.includes('Caching Substrate')) {
            if (activeLoading) {
                // Injects a pulsing terminal indicator directly into the text layout block
                el.innerHTML = `📡 <span style="color: #60a5fa; font-weight: bold; animation: pulse 1.5s infinite;">SYNCING MATRIX...</span> [${progressPercentage}%] <br/><span style="font-size: 0.8rem; color: #9ca3af; font-family: monospace;">${message}</span>`;
            } else {
                el.textContent = `${message} ${progressPercentage}%`;
            }
        }
    });
}

// ==========================================
// 1. ENGINE COLD BOOT (Native ONNX Shard Stream with Self-Injecting DOM Visualizer)
// ==========================================
export async function bootCipherEngine() {
    if (session) {
        updateTerminalDOM('Substrate Ready', 100);
        return session;
    }

    const ort = getGlobalOrt();
    if (!ort) {
        throw new Error("ONNX Runtime global script has not loaded in the browser context yet.");
    }

    // Inject CSS keyframe animation for the terminal pulse effect if missing
    if (typeof document !== 'undefined' && !document.getElementById('cipher-terminal-css')) {
        const style = document.createElement('style');
        style.id = 'cipher-terminal-css';
        style.innerHTML = `@keyframes pulse { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }`;
        document.head.appendChild(style);
    }

    try {
        updateTerminalDOM('Parsing Topography...', 12);
        const modelUrl = '/models/model_quantized.onnx';

        // Update the static 15% text to an active background streaming status read-out
        updateTerminalDOM('Downloading Chunks 0-3 via HF Backbone Pipelines...', 15, true);

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
        
        updateTerminalDOM('Substrate Initialized. Local System Online.', 100);
        return session;
    } catch (err) {
        updateTerminalDOM('System Initialization Halted.', 0);
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
