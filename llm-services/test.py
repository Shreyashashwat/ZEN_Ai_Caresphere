import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

# Configure the API
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

print("Available models that support generateContent:")
print("-" * 50)

for model in genai.list_models():
    if 'generateContent' in model.supported_generation_methods:
        print(f"✓ {model.name}")

print("-" * 50)