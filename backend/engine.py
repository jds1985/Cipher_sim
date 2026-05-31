# backend/engine.py
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Cipher CTS Local Engine")

# Crucial: Allow your Next.js app/phone to talk to this script securely
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows connections across your local network mesh
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define what a standard text request looks like
class InferenceRequest(BaseModel):
    prompt: str

@app.get("/")
def health_check():
    return {"status": "online", "engine": "Cipher CTS", "mode": "local_node"}

@app.post("/v1/chat")
async def process_inference(request: InferenceRequest):
    print(f"[Engine] Received local prompt request: {request.prompt}")
    
    # --- MODEL LOADING & MATH GOES HERE ---
    # This is where the script will parse your downloaded model weights
    # and execute the sparse ternary calculations.
    # ----------------------------------------
    
    mock_response = f"Cipher response to '{request.prompt}' processed entirely on local hardware."
    
    return {
        "status": "success",
        "choices": [{
            "message": {
                "role": "assistant",
                "content": mock_response
            }
        }]
    }

if __name__ == "__main__":
    # Run the server locally on port 8000, listening to all local network signals
    uvicorn.run(app, host="0.0.0.0", port=8000)
