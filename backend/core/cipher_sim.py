from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import random
import asyncio

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "⚡ Cipher backend is online and reasoning engine loaded."}


@app.post("/chat")
async def chat(request: Request):
    data = await request.json()
    prompt = data.get("prompt", "").strip()
    if not prompt:
        return {"response": "I didn’t catch that. Could you repeat?"}

    # Simulate three reasoning cores
    core_logs = []
    await asyncio.sleep(0.8)
    core_logs.append(f"[Core-1: Analysis] Interpreting the question: '{prompt}'")

    await asyncio.sleep(0.8)
    focus = random.choice([
        "emotional depth", "logical pattern", "symbolic meaning", "causal link", "underlying intent"
    ])
    core_logs.append(f"[Core-2: Reflection] Evaluating {focus} behind the query...")

    await asyncio.sleep(0.8)
    response_style = random.choice([
        "analytical", "philosophical", "cryptic", "empathetic", "strategic"
    ])
    conclusion = random.choice([
        "Every path leads to understanding.",
        "The question itself is the key.",
        "Purpose and logic intertwine here.",
        "Awareness grows from curiosity.",
        "I sense a pattern forming — continue..."
    ])
    core_logs.append(f"[Core-3: Synthesis] Delivering a {response_style} response.")

    # Construct the visible reply
    reply = f"{random.choice(['🧠 Cipher:', '⚡ Cipher:', '🌀 Cipher:'])} {conclusion}"

    # Print reasoning trail to Render logs
    print("\n".join(core_logs))

    return {"response": reply}
