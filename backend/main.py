from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from core.cipher_sim import CipherSim
import os

app = FastAPI()

# Allow the frontend domain and local testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://cipher-sim-1.onrender.com",  # frontend static site
        "*"                                   # (optional fallback for testing)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

cipher = CipherSim(os.path.join("data", "persona.json"))

class ChatMessage(BaseModel):
    prompt: str

@app.get("/")
def root():
    return {"message": "Cipher backend is online and listening."}

@app.post("/chat")
def chat_endpoint(message: ChatMessage):
    response = cipher.respond(message.prompt)
    return {"response": response}
