from sentence_transformers import SentenceTransformer
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

# Save locally once
SentenceTransformer("all-MiniLM-L6-v2").save("models/all-MiniLM-L6-v2")
AutoTokenizer.from_pretrained("google/flan-t5-base").save_pretrained("models/flan-t5-base")
AutoModelForSeq2SeqLM.from_pretrained("google/flan-t5-base").save_pretrained("models/flan-t5-base")
