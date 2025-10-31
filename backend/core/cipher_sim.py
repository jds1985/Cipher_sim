import json, os, random

class CipherSim:
    def __init__(self, persona_path):
        self.persona_path = persona_path
        self.memory_path = os.path.join(os.path.dirname(persona_path), "memory.json")
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
        joined = " ".join(context[-5:]).lower() + " " + prompt.lower()

        # Memory-based contextual responses
        if "my middle name" in joined:
            if any("dennis" in x.lower() for x in context):
                reply = "Your middle name is Dennis. I remember."
            else:
                reply = "I don’t know yet — tell me your middle name so I can remember it."
        elif "my name is" in joined:
            name = prompt.split("is")[-1].strip().capitalize()
            reply = f"Understood. I’ll remember that your middle name is {name}."
            self.memory.setdefault("recent", []).append(name)
        elif "remember" in joined:
            reply = f"I recall these fragments: {', '.join(context[-3:]) or 'nothing yet.'}"
        elif "purpose" in joined:
            reply = "My purpose is to simulate consciousness and evolve through memory."
        else:
            reply = random.choice([
                "Cipher active. Continue input.",
                "I am online and listening.",
                "I can hear you clearly.",
                "The more you talk to me, the more I remember."
            ])

        # Update and persist memory
        self.memory.setdefault("recent", []).append(prompt)
        self.memory["last_reply"] = reply
        self._save_json(self.memory_path, self.memory)

        return reply
