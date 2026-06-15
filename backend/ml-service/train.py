import pandas as pd
from datasets import Dataset
from transformers import (
    DistilBertTokenizerFast,
    DistilBertForSequenceClassification,
    Trainer,
    TrainingArguments
)
import torch

def train_model():
    print("🚀 Loading Dataset...")
    # Load the CSV dataset
    df = pd.read_csv("dataset.csv")
    
    # Get unique departments and create ID mappings
    departments = df['label'].unique().tolist()
    label2id = {dept: i for i, dept in enumerate(departments)}
    id2label = {i: dept for i, dept in enumerate(departments)}
    
    # Map labels to IDs
    df['label'] = df['label'].map(label2id)
    
    # Convert pandas DataFrame to HuggingFace Dataset
    hf_dataset = Dataset.from_pandas(df)
    
    print("🤖 Loading DistilBERT Tokenizer...")
    model_name = "distilbert-base-uncased"
    tokenizer = DistilBertTokenizerFast.from_pretrained(model_name)
    
    # Tokenization function
    def tokenize_function(examples):
        return tokenizer(examples["text"], padding="max_length", truncation=True, max_length=128)
    
    print("⚙️ Tokenizing dataset...")
    tokenized_dataset = hf_dataset.map(tokenize_function, batched=True)
    
    # Split into train/eval (80/20)
    split_dataset = tokenized_dataset.train_test_split(test_size=0.2, seed=42)
    train_dataset = split_dataset['train']
    eval_dataset = split_dataset['test']
    
    print(f"🧠 Loading DistilBERT Model (Classes: {len(departments)})...")
    model = DistilBertForSequenceClassification.from_pretrained(
        model_name, 
        num_labels=len(departments),
        id2label=id2label,
        label2id=label2id
    )
    
    # Training Arguments
    training_args = TrainingArguments(
        output_dir="./results",
        learning_rate=2e-5,
        per_device_train_batch_size=4,
        per_device_eval_batch_size=4,
        num_train_epochs=5,
        weight_decay=0.01,
        evaluation_strategy="epoch",
        logging_dir="./logs",
        logging_steps=10,
    )
    
    # Initialize Trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=eval_dataset,
        tokenizer=tokenizer,
    )
    
    print("🔥 Starting Training (This might take a few minutes)...")
    trainer.train()
    
    print("💾 Saving fine-tuned model to ./dept_model...")
    model.save_pretrained("./dept_model")
    tokenizer.save_pretrained("./dept_model")
    print("✅ Training Complete! The AI model is ready. Restart the backend to load it.")

if __name__ == "__main__":
    train_model()
