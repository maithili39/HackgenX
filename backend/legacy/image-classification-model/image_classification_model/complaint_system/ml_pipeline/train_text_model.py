import os
import pickle
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

def train_and_save_model():
    # Sample data for training
    # In a real scenario, this would be loaded from a database or a large CSV file.
    data = {"text": [
        "There is a huge pothole on main street, please fix it.",
        "Garbage overflow near the park for 3 days.",
        "Buy cheap shoes online at example.com",
        "Make money fast!!! Click here.",
        "Streetlight is broken on 5th avenue.",
        "Water pipe burst near the school, flooding the road.",
        "asdfasdfasdfasdfadsf",
        "Call this number for dating 9999999999",
        "Hello i want a refund for my dress", # irrelevant
        "The drainage is blocked and water is stinking."
    ], "label": [0, 0, 1, 1, 0, 0, 1, 1, 1, 0]} # 0 = Genuine, 1 = Spam
    
    df = pd.DataFrame(data)
    
    X_train, X_test, y_train, y_test = train_test_split(df['text'], df['label'], test_size=0.2, random_state=42)
    
    # Create Pipeline
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(max_features=5000, stop_words='english')),
        ('clf', LogisticRegression(random_state=42))
    ])
    
    # Train
    pipeline.fit(X_train, y_train)
    
    # Evaluate
    preds = pipeline.predict(X_test)
    print("Model Training Complete:")
    print(classification_report(y_test, preds))
    
    # Save Model
    model_path = os.path.join(os.path.dirname(__file__), '..', 'models', 'text_spam_model.pkl')
    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    with open(model_path, 'wb') as f:
        pickle.dump(pipeline, f)
    
    print(f"Model saved to {model_path}")

if __name__ == "__main__":
    train_and_save_model()
