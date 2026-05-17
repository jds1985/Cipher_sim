import os
import json
import glob
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from transformers import AutoTokenizer

# 1. Custom Dataset that dynamically reads all JSONL files from your folder path
class TernaryDataset(Dataset):
    def __init__(self, data_folder, tokenizer, max_length=512):
        self.examples = []
        self.tokenizer = tokenizer
        self.max_length = max_length

        # Find all .jsonl files inside the target folder
        search_path = os.path.join(data_folder, "*.jsonl")
        jsonl_files = sorted(glob.glob(search_path))

        if not jsonl_files:
            print(f"WARNING: No .jsonl files found in path: {data_folder}")
            return

        print(f"Found {len(jsonl_files)} dataset layers in targeted directory structure.")
        
        # Parse through each file sequentially
        for file_path in jsonl_files:
            print(f"Loading data matrix from: {os.path.basename(file_path)}")
            with open(file_path, 'r', encoding='utf-8') as f:
                for line in f:
                    if line.strip():
                        try:
                            data = json.loads(line)
                            # Checks common keys like text or input
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

# 2. Simple Ternary Weight Quantization Function (BitNet 1.58b Style)
def quantize_ternary(weight):
    scale = weight.abs().mean()
    if scale == 0:
        return weight
    quantized = torch.round(weight / scale).clamp(-1, 1)
    return quantized * scale

# 3. Model Wrapper to enforce ternary scaling during forward pass
class CipherTernaryLayer(nn.Module):
    def __init__(self, input_dim, output_dim):
        super().__init__()
        self.weight = nn.Parameter(torch.randn(output_dim, input_dim) * 0.02)
        self.bias = nn.Parameter(torch.zeros(output_dim))

    def forward(self, x):
        ternary_weight = quantize_ternary(self.weight)
        return nn.functional.linear(x, ternary_weight, self.bias)

# 4. Main Training Core
def main():
    print("Initializing Cipher Substrate Training Pipeline...")
    
    # Configurations
    epochs = 3
    batch_size = 16
    learning_rate = 5e-4
    
    # YOUR EXACT REPOSITORY FOLDER PATH
    dataset_folder = "data/training_gold"
    
    # Initialize tokenizer (using a lightweight base tokenizer for structure)
    tokenizer = AutoTokenizer.from_pretrained("bert-base-uncased")
    if tokenizer.pad_token is None:
        tokenizer.add_special_tokens({'pad_token': '[PAD]'})

    # Load Data from directory structure
    if not os.path.exists(dataset_folder):
        print(f"CRITICAL ERROR: Directory path '{dataset_folder}' not found.")
        print("Please verify the repo cloned completely and the relative folder path is correct.")
        return
        
    dataset = TernaryDataset(dataset_folder, tokenizer)
    if len(dataset) == 0:
        print("CRITICAL ERROR: Dataset matrix is empty. Halting build pipeline.")
        return
        
    dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True)
    
    # Device setup (RunPod GPU optimization)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Running compute on target substrate device: {device}")
    
    vocab_size = len(tokenizer)
    embedding = nn.Embedding(vocab_size, 256).to(device)
    ternary_engine = CipherTernaryLayer(256, vocab_size).to(device)
    
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(list(embedding.parameters()) + list(ternary_engine.parameters()), lr=learning_rate)
    
    # Loop
    for epoch in range(epochs):
        print(f"\n--- Epoch {epoch + 1}/{epochs} Initialized ---")
        total_loss = 0
        
        for batch_idx, batch in enumerate(dataloader):
            input_ids = batch["input_ids"].to(device)
            
            optimizer.zero_grad()
            
            # Forward pass
            embedded = embedding(input_ids)
            outputs = ternary_engine(embedded)
            
            # Shift targets for next-token prediction language modeling
            loss = criterion(outputs[:, :-1, :].reshape(-1, vocab_size), input_ids[:, 1:].reshape(-1))
            
            loss.backward()
            optimizer.step()
            
            total_loss += loss.item()
            
            if batch_idx % 10 == 0:
                print(f"Batch {batch_idx}/{len(dataloader)} | Current Loss Target: {loss.item():.4f}")
                
        print(f"Epoch {epoch + 1} Complete. Average Substrate Loss: {total_loss / len(dataloader):.4f}")
        
    # Save the baked weights
    print("\nTraining complete. Archiving ternary brain weights...")
    torch.save(ternary_engine.state_dict(), "cipher_ternary_weights.pt")
    print("Weights successfully saved to 'cipher_ternary_weights.pt'. Pipeline secure.")

if __name__ == "__main__":
    main()
