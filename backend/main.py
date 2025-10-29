from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from core.cipher_sim import CipherSim
import os

app = FastAPI()

# Allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Cipher (safe fallback if persona file missing)
persona_path = os.path.join("data", "persona.json")
if os.path.exists(persona_path):
    cipher = CipherSim(persona_path)
else:
    class CipherSim:
        def respond(self, prompt):
            return f"Cipher is online but no persona found. You said: '{prompt}'"
    cipher = CipherSim()

# Root route (for easy check in browser)
@app.get("/")
def home():
    return {"message": "⚡ Cipher backend is online and listening."}

# Chat route
class ChatMessage(BaseModel):
    prompt: str

@app.post("/chat")
def chat_endpoint(message: ChatMessage):
    try:
        response = cipher.respond(message.prompt)
        return {"response": response}
    except Exception as e:
        return {"response": f"Error processing: {e}"}
