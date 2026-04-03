import re
import os
import pickle

class TextSpamDetector:
    def __init__(self):
        # Load the ML model
        model_path = os.path.join(os.path.dirname(__file__), '..', 'models', 'text_spam_model.pkl')
        self.model = None
        if os.path.exists(model_path):
            with open(model_path, 'rb') as f:
                self.model = pickle.load(f)
                
        # Rule-based resources
        self.abuse_words = {"idiot", "stupid", "dumb", "fake", "scam"} # Expand in production
        self.url_pattern = re.compile(r'https?://\S+|www\.\S+')

    def analyze(self, text: str) -> dict:
        """
        Analyzes the text for spam or irrelevance.
        Returns a dict with 'score' (0-100) and 'reasons' (list of strings).
        """
        reasons = []
        score = 0
        
        # Rule 1: Very short text
        if len(text.strip()) < 10:
            reasons.append("Text is suspiciously short.")
            score += 40
            
        # Rule 2: Repeated characters
        if re.search(r'(.)\1{4,}', text):
            reasons.append("Contains excessive repeated characters.")
            score += 30
            
        # Rule 3: Abuse words
        text_lower = text.lower()
        if any(word in text_lower for word in self.abuse_words):
            reasons.append("Contains offensive or abusive language.")
            score += 50
            
        # Rule 4: URLs / ads
        if self.url_pattern.search(text):
            reasons.append("Contains URLs or potential promotional content.")
            score += 60
            
        # ML Prediction
        if self.model:
            # spam prob
            spam_prob = self.model.predict_proba([text])[0][1]
            ml_score = int(spam_prob * 100)
            if ml_score > 50:
                reasons.append(f"ML Classifier detected spam (Confidence: {ml_score}%).")
            # We take the max of rule-based or ML score to be conservative, or simply add them
            score = max(score, ml_score)
        else:
            reasons.append("(ML Model not loaded)")
            
        # Cap score at 100
        score = min(score, 100)
        
        return {
            "is_flagged": score > 30,
            "score": score,
            "reasons": reasons
        }
