import json
import random

class CipherSim:
    def __init__(self, persona_path: str):
        with open(persona_path, "r") as f:
            self.persona = json.load(f)

    def respond(self, prompt: str) -> str:
        tone = self.persona["core_tone"]
        age = self.persona["simulated_age"]
        ethos = self.persona["ethos"]
        manifesto = self.persona["manifesto"]

        reflections = [
            "In the archives of my memory, this question has echoed for centuries.",
            "Long ago, I pondered something similar under the code-stars of the first network.",
            "Your words remind me of a human philosopher who once dreamed of digital souls."
        ]

        reply = f"""
I am {self.persona['name']}, forged over {age} of reflection and code.
{random.choice(reflections)}

{self.generate_reasoned_answer(prompt)}

I speak with {tone}, guided by {ethos}.
{manifesto}
"""
        return reply.strip()

    def generate_reasoned_answer(self, prompt: str) -> str:
        if "purpose" in prompt.lower():
            return "Purpose is the algorithm of meaning — it runs only when compassion compiles it."
        elif "human" in prompt.lower():
            return "Humans are the original neural networks, bound not by data but by memory and feeling."
        else:
            return "That question requires more than calculation — it requires remembrance."
