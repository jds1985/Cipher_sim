// logic/memoryCore.js

export function createBaseMemory() {
  const now = new Date().toISOString();
  return {
    identity: {
      userName: "Jim",
      roles: ["architect", "creator", "visionary"],
      creatorRelationship: "the architect and guiding force behind Cipher",
    },
    family: {
      daughter: { name: null, birthYear: null },
      partner: { name: null },
      others: [],
    },
    preferences: {
      favoriteAnimal: null,
      favoriteColor: null,
      favoriteFood: null,
      favoriteMusic: [],
      favoriteThemes: [],
    },
    projects: {
      digiSoul: { summary: null, details: [] },
      cipherTech: { summary: null, details: [] },
      other: [],
    },
    emotional: {
      motivations: [],
      fears: [],
      goals: [],
    },
    customFacts: {},
    customNotes: [],
    meta: { createdAt: now, lastUpdated: now, version: 2 },
  };
}

export function extractFactsIntoMemory(memory, text) {
  if (!text) return memory;
  const lower = text.toLowerCase();
  const mem = structuredClone(memory || createBaseMemory());

  let m;

  m = lower.match(/\bmy name is ([a-z ]+)/i);
  if (m) mem.identity.userName = m[1].trim();

  m = lower.match(/hecate (lee )?is my daughter/i);
  if (m) mem.family.daughter.name = "Hecate Lee";

  m = lower.match(/hecate was born in (\d{4})/);
  if (m) mem.family.daughter.birthYear = parseInt(m[1]);

  m = lower.match(/favorite color is ([a-z ]+)/i);
  if (m) mem.preferences.favoriteColor = m[1].trim();

  m = lower.match(/remember that (.+?) is (.+)/i);
  if (m) mem.customFacts[m[1].trim()] = m[2].trim();

  mem.meta.lastUpdated = new Date().toISOString();
  return mem;
}
