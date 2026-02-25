import os
import google.generativeai as genai
from openai import OpenAI

class LLMService:
    def __init__(self):
        # 1. Configure Gemini (Primary)
        self.gemini_key = os.getenv("GEMINI_API_KEY")
        self.gemini_model = None
        if self.gemini_key:
            try:
                genai.configure(api_key=self.gemini_key)
                self.gemini_model = genai.GenerativeModel('gemini-2.5-flash')
            except Exception as e:
                print(f"Gemini Init Error: {e}")

        # 2. Configure Groq (Fallback)
        # Groq uses the OpenAI SDK but points to their own high-speed API servers
        self.groq_key = os.getenv("GROQ_API_KEY")
        self.groq_client = None
        if self.groq_key:
            try:
                self.groq_client = OpenAI(
                    base_url="https://api.groq.com/openai/v1",
                    api_key=self.groq_key
                )
            except Exception as e:
                print(f"Groq Init Error: {e}")

    def generate_text(self, system_prompt, user_prompt):
        """
        Generates text using Gemini (Primary) or Groq (Fallback).
        """
        # --- Attempt 1: Gemini ---
        if self.gemini_model:
            try:
                combined_prompt = f"{system_prompt}\n\nUser Request: {user_prompt}"
                response = self.gemini_model.generate_content(combined_prompt)
                return response.text
            except Exception as e:
                print(f"Gemini API Failed: {e}")
                # If Groq is not configured, we must fail here
                if not self.groq_client:
                    raise e
        
        # --- Attempt 2: Groq (Fallback) ---
        if self.groq_client:
            print("Switching to Groq (Llama 3)...")
            try:
                # Use Llama 3 8B (Fast & Free Tier friendly)
                response = self.groq_client.chat.completions.create(
                    model="llama-3.3-70b-versatile", 
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=0.4
                )
                return response.choices[0].message.content
            except Exception as e:
                print(f"Groq API Failed: {e}")
                raise e # Both providers failed
        
        raise Exception("No LLM provider configured or available.")

llm_service = LLMService()