import pandas as pd
import re


def smart_summary(text: str) -> str:
    """
    Simple rule-based summary generator for complaint text.
    Modify logic as needed, but function name must remain 'smart_summary'.
    """
    if not text or not isinstance(text, str):
        return ""
    text = text.strip()
    if len(text.split()) <= 10:
        return text
    # Basic rule-based summarization logic
    sentences = text.split(".")
    first = sentences[0].strip()
    if "water" in text.lower():
        return f"Summary: Water issue - {first}"
    elif "power" in text.lower() or "electric" in text.lower():
        return f"Summary: Power issue - {first}"
    elif "road" in text.lower():
        return f"Summary: Road condition - {first}"
    elif "garbage" in text.lower() or "sewage" in text.lower():
        return f"Summary: Sanitation problem - {first}"
    else:
        return f"Summary: General complaint - {first}"
