from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from core.cipher_sim import CipherSim
import os
import json

# Initialize FastAPI app
app = FastAPI()

# Allow frontend requests (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Cipher simulation
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
PERSONA_PATH = os.path.join(DATA_DIR, "persona.json")

if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

cipher = CipherSim(PERSONA_PATH)


# =====================
#  ROUTES
# =====================

@app.get("/")
def root():
    return {"message": "⚡ Cipher backend online — memory module active."}


# ----- CHAT ENDPOINT -----
class ChatMessage(BaseModel):
    prompt: str

@app.post("/chat")
async def chat_endpoint(message: ChatMessage):
    response = cipher.respond(message.prompt)
    return {"response": response}


# ----- MEMORY ENDPOINTS -----

@app.get("/memory")
def get_memory():
    """Return all stored memory data"""
    memory_path = os.path.join(DATA_DIR, "memory.json")
    if not os.path.exists(memory_path):
        return {"status": "empty", "memory": {}}

    with open(memory_path, "r") as f:
        data = json.load(f)
    return {"status": "ok", "memory": data}


@app.delete("/memory/reset")
def reset_memory():
    """Clear all memory"""
    memory_path = os.path.join(DATA_DIR, "memory.json")
    if os.path.exists(memory_path):
        os.remove(memory_path)
        return {"status": "cleared", "message": "Cipher's memory has been reset."}
    return {"status": "not_found", "message": "No memory file found to reset."}
