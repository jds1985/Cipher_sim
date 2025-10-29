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

# Initialize Cipher
cipher = CipherSim(os.path.join("data", "persona.json"))

class ChatMessage(BaseModel):
    prompt: str

@app.post("/chat")
def chat_endpoint(message: ChatMessage):
    response = cipher.respond(message.prompt)
    return {"response": response}
