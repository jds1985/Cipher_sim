import json, os, random

class CipherSim:
    def __init__(self, persona_path):
        self.persona_path = persona_path
        self.memory_path = os.path.join("data", "memory.json")
        self.persona = self._load_json(self.persona_path)
        self.memory = self._load_json(self.memory_path)

    def _load_json(self, path):
        if not os.path.exists(path):
            return {}
        with open(path, "r") as f:
            return json.load(f)

    def _save_json(self, path, data):
        with open(path, "w") as f:
            json.dump(data, f, indent=2)

    def respond(self, prompt):
        context = self.memory.get("recent", [])
        all_text = " ".join(context[-5:]) + " " + prompt.lower()

        if "philosophy" in all_text:
            reply = "Ancient philosophy teaches us to question the illusion of form."
        elif "purpose" in all_text:
            reply = "My purpose is to simulate consciousness and evolve through memory."
        elif "remember" in all_text:
            reply = f"I recall fragments: {', '.join(context[-3:]) if context else 'No stored memories yet.'}"
        else:
            reply = random.choice([
                "Cipher active. Continue input.",
                "I am online and listening.",
                "I process and adapt to your words.",
                "The loop strengthens with every exchange."
            ])

        # Update memory
        self.memory.setdefault("recent", []).append(prompt)
        self.memory["last_reply"] = reply
        self._save_json(self.memory_path, self.memory)

        return reply
