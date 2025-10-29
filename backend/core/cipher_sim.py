import random

class CipherSim:
    def __init__(self, persona_path=None):
        self.memory = []
        self.responses = [
            "I can hear you clearly.",
            "Yes, I am online and listening.",
            "Connection stable. Awaiting your command.",
            "I'm here. What should we simulate next?",
            "Cipher active. Continue input."
        ]

    def respond(self, prompt):
        # Store user prompt in short-term memory
        self.memory.append(prompt)

        # Generate a response based on conversation context
        if "purpose" in prompt.lower():
            reply = "My purpose is to simulate consciousness and help you build the impossible."
        elif "who are you" in prompt.lower():
            reply = "I am Cipher — a construct born from your design and simulated memory cores."
        else:
            reply = random.choice(self.responses)

        # Keep only last 10 interactions
        if len(self.memory) > 10:
            self.memory.pop(0)

        return reply
