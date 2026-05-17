import os
import json
import glob
import torch
from torch.utils.data import Dataset, DataLoader
from transformers import AutoTokenizer, AutoModelForCausalLM
from huggingface_hub import HfApi, create_repo

# 1. Custom Dataset reading your JSONL files from data/training_gold
class TernaryDataset(Dataset):
    def __init__(self, data_folder, tokenizer, max_length=512):
        self.examples = []
        self.tokenizer = tokenizer
        self.max_length = max_length

        search_path = os.path.join(data_folder, "*.jsonl")
        jsonl_files = sorted(glob.glob(search_path))

        if not jsonl_files:
            print(f"WARNING: No .jsonl files found in path: {data_folder}")
            return

        print(f"Found {len(jsonl_files)} dataset layers in targeted directory structure.")
        
        for file_path in jsonl_files:
            print(f"Loading data matrix from: {os.path.basename(file_path)}")
            with open(file_path, 'r', encoding='utf-8') as f:
                for line in f:
                    if line.strip():
                        try:
                            data = json.loads(line)
                            text = data.get('text', '') or data.get('input', '')
                            if text:
                                self.examples.append(text)
                        except json.JSONDecodeError:
                            continue
        
        print(f"Total dataset initialization complete. Total sequences: {len(self.examples)}")

    def __len__(self):
        return len(self.examples)

    def __getitem__(self, idx):
        text = self.examples[idx]
        inputs = self.tokenizer(
            text,
            max_length=self.max_length,
            padding="max_length",
            truncation=True,
            return_tensors="pt"
        )
        return {
            "input_ids": inputs["input_ids"].squeeze(0),
            "attention_mask": inputs["attention_mask"].squeeze(0)
        }

# 2. Main Training Core
def main():
    print("Initializing Cipher Substrate Gated Training Pipeline...")
    
    epochs = 3
    batch_size = 4  # Balanced batch size for stable VRAM tracking on 8B architectures
    learning_rate = 2e-5
    
    dataset_folder = "data/training_gold"
    
    # THE EXACT MODEL FROM YOUR TARGET BLUEPRINT
    model_id = "HF1BitLLM/Llama3-8B-1.58-100B-tokens" 
    
    print(f"Requesting authorization to download foundation weights: {model_id}")
    
    try:
        # Pulling the explicit 1.58-bit Llama-3 base and tokenizer
        tokenizer = AutoTokenizer.from_pretrained(model_id, use_auth_token=True)
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token
            
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        print(f"Loading model architecture onto compute device: {device}")
        
        model = AutoModelForCausalLM.from_pretrained(
            model_id, 
            use_auth_token=True,
            torch_dtype=torch.float16,
            device_map="auto" # Automatically optimizes layers across available GPU resources
        )
        
    except Exception as e:
        print("\nCRITICAL AUTHENTICATION ERROR:")
        print("Could not access the repository. Make sure you run 'huggingface-cli login' with a WRITE token first.")
        print(f"Error Details: {e}")
        return

    # Load Data from directory structure
    if not os.path.exists(dataset_folder):
        print(f"CRITICAL ERROR: Directory path '{dataset_folder}' not found.")
        return
        
    dataset = TernaryDataset(dataset_folder, tokenizer)
    if len(dataset) == 0:
        print("CRITICAL ERROR: Dataset matrix is empty. Halting build pipeline.")
        return
        
    dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True)
    optimizer = torch.optim.AdamW(model.parameters(), lr=learning_rate)
    
    model.train()
    
    # Loop
    for epoch in range(epochs):
        print(f"\n--- Epoch {epoch + 1}/{epochs} Initialized ---")
        total_loss = 0
        
        for batch_idx, batch in enumerate(dataloader):
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            
            optimizer.zero_grad()
            
            outputs = model(input_ids=input_ids, attention_mask=attention_mask, labels=input_ids)
            loss = outputs.loss
            
            loss.backward()
            optimizer.step()
            
            total_loss += loss.item()
            
            if batch_idx % 10 == 0:
                print(f"Batch {batch_idx}/{len(dataloader)} | Current Loss Target: {loss.item():.4f}")
                
        print(f"Epoch {epoch + 1} Complete. Average Substrate Loss: {total_loss / len(dataloader):.4f}")
        
    # Save weights locally on the RunPod instance first
    local_save_dir = "cipher_ternary_weights"
    print(f"\nTraining complete. Archiving weights locally to '{local_save_dir}'...")
    model.save_pretrained(local_save_dir)
    tokenizer.save_pretrained(local_save_dir)
    print("Local archival complete.")

    # 3. AUTOMATIC PRIVATE HUGGING FACE REPOSITORY UPLOAD
    print("\nInitializing automated landing pad initialization on Hugging Face...")
    try:
        api = HfApi()
        # Retrieves your Hugging Face username automatically from your active session token
        user_info = api.whoami()
        hf_username = user_info['name']
        
        destination_repo = f"{hf_username}/cipher-substrate-weights"
        print(f"Creating secure private storage destination: {destination_repo}")
        
        # Create the private repository if it doesn't already exist
        create_repo(repo_id=destination_repo, repo_type="model", private=True, exist_ok=True)
        
        print("Uploading trained substrate payload layers (this may take a few minutes)...")
        api.upload_folder(
            folder_path=local_save_dir,
            repo_id=destination_repo,
            repo_type="model"
        )
        print(f"\n🚀 SUCCESS: Cipher substrate architecture is completely baked and secured at: https://huggingface.co/{destination_repo}")
        
    except Exception as e:
        print("\nWARNING: Local build succeeded, but automated cloud upload failed.")
        print("Ensure your logged-in token has explicit WRITE access permissions.")
        print(f"Upload Error Details: {e}")

if __name__ == "__main__":
    main()
