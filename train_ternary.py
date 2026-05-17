import os
import json
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from transformers import AutoTokenizer

# 1. Custom Dataset for your JSONL files
class TernaryDataset(Dataset):
    def __init__(self, data_path, tokenizer, max_length=512):
        self.examples = []
        with open(data_path, 'r', encoding='utf-8') as f:
            for line in f:
                if line.strip():
                    data = json.loads(line)
                    # Adjust 'text' if your JSONL key has a different name (e.g., 'input', 'prompt')
                    text = data.get('text', '') or data.get('input', '')
                    if text:
                        self.examples.append(text)
        
        self.tokenizer = tokenizer
        self.max_length = max_length

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
        # Squeeze to remove batch dimension added by return_tensors
        return {
            "input_ids": inputs["input_ids"].squeeze(0),
            "attention_mask": inputs["attention_mask"].squeeze(0)
        }

# 2. Simple Ternary Weight Quantization Function (BitNet 1.58b Style)
def quantize_ternary(weight):
    """Quantizes weights to -1, 0, or +1 based on scale."""
    scale = weight.abs().mean()
    if scale == 0:
        return weight
    
    # Scale, round to nearest integer (-1, 0, 1), and clamp
    quantized = torch.round(weight / scale).clamp(-1, 1)
    return quantized * scale

# 3. Basic Model Wrapper to enforce ternary scaling during forward pass
class CipherTernaryLayer(nn.Module):
    def __init__(self, input_dim, output_dim):
        super().__init__()
        self.weight = nn.Parameter(torch.randn(output_dim, input_dim) * 0.02)
        self.bias = nn.Parameter(torch.zeros(output_dim))

    def forward(self, x):
        # Apply ternary quantization to weights right before multiplication
        ternary_weight = quantize_ternary(self.weight)
        return nn.functional.linear(x, ternary_weight, self.bias)

# 4. Main Training Core
def main():
    print("Initializing Cipher Substrate Training Pipeline...")
    
    # Configurations
    epochs = 3
    batch_size = 16
    learning_rate = 5e-4
    dataset_file = "dataset.jsonl"  # Change this to match your actual file name
    
    # Initialize tokenizer (using a lightweight base tokenizer for structure)
    tokenizer = AutoTokenizer.from_pretrained("bert-base-uncased")
    if tokenizer.pad_token is None:
        tokenizer.add_special_tokens({'pad_token': '[PAD]'})

    # Load Data
    if not os.path.exists(dataset_file):
        print(f"CRITICAL ERROR: Dataset file '{dataset_file}' not found.")
        return
        
    dataset = TernaryDataset(dataset_file, tokenizer)
    dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True)
    
    # Device setup (RunPod GPU optimization)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Running compute on target substrate device: {device}")
    
    # Dummy embedding network using our custom ternary architecture layer
    # (In a full scale run, this connects to your wider BitNet transformer block)
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
                print(f"Batch {batch_idx} | Current Loss Target: {loss.item():.4f}")
                
        print(f"Epoch {epoch + 1} Complete. Average Substrate Loss: {total_loss / len(dataloader):.4f}")
        
    # Save the baked weights
    print("\nTraining complete. Archiving ternary brain weights...")
    torch.save(ternary_engine.state_dict(), "cipher_ternary_weights.pt")
    print("Weights successfully saved to 'cipher_ternary_weights.pt'. Pipeline secure.")

if __name__ == "__main__":
    main()
