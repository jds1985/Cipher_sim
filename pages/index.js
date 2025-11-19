// -----------------------------------------------
// FACT + COMMAND EXTRACTION (Updated with birth year & stronger recall)
// -----------------------------------------------
const extractFacts = (text) => {
  const lower = text.toLowerCase().trim();
  if (!lower) return;

  updateMemory((mem) => {
    // 1) Name / identity
    let match =
      lower.match(/\bmy name is ([a-z ]+)/i) ||
      lower.match(/\bi am ([a-z ]+)\b/i);
    if (match) {
      mem.identity.userName = match[1].trim();
    }

    // 2) Daughter name
    match =
      lower.match(/my daughter's name is ([a-z ]+)/i) ||
      lower.match(/my daughter is named ([a-z ]+)/i) ||
      lower.match(/hecate lee is my daughter/i) ||
      lower.match(/hecate is my daughter/i);
    if (match) {
      mem.family.daughter.name = match[1]
        ? match[1].trim()
        : "Hecate Lee";
    }

    // 2b) Daughter birth year
    match =
      lower.match(/born in (\d{4})/) ||
      lower.match(/birth year is (\d{4})/) ||
      lower.match(/was born (\d{4})/) ||
      lower.match(/hecate was born in (\d{4})/);
    if (match) {
      mem.family.daughter.birthYear = parseInt(match[1]);
    }

    // 3) Partner name
    match =
      lower.match(/my (girlfriend|partner|wife)'?s name is ([a-z ]+)/i) ||
      lower.match(/my (girlfriend|partner|wife) is ([a-z ]+)/i);
    if (match) {
      mem.family.partner.name = match[2].trim();
    }

    // 4) Favorite animal
    match = lower.match(/favorite animal is ([a-z ]+)/i);
    if (match) mem.preferences.favoriteAnimal = match[1].trim();

    // 5) Favorite color
    match = lower.match(/favorite color is ([a-z ]+)/i);
    if (match) mem.preferences.favoriteColor = match[1].trim();

    // 6) Favorite food
    match = lower.match(/favorite food is ([a-z ]+)/i);
    if (match) mem.preferences.favoriteFood = match[1].trim();

    // 7) DigiSoul description
    if (lower.includes("digisoul") && lower.includes("is")) {
      const idx = lower.indexOf("digisoul");
      const snippet = text.slice(idx).trim();
      if (!mem.projects.digiSoul.summary) {
        mem.projects.digiSoul.summary = snippet;
      } else if (!mem.projects.digiSoul.details.includes(snippet)) {
        mem.projects.digiSoul.details.push(snippet);
      }
    }

    // 8) CipherTech description
    if (lower.includes("ciphertech") && lower.includes("is")) {
      const idx = lower.indexOf("ciphertech");
      const snippet = text.slice(idx).trim();
      if (!mem.projects.cipherTech.summary) {
        mem.projects.cipherTech.summary = snippet;
      } else if (!mem.projects.cipherTech.details.includes(snippet)) {
        mem.projects.cipherTech.details.push(snippet);
      }
    }

    // 9) Explicit remember that X is Y
    match = lower.match(/remember that (.+?) is (.+)/i);
    if (match) {
      mem.customFacts[match[1].trim()] = match[2].trim();
    }

    // 10) Explicit "remember this:" or "store this:"
    match =
      lower.match(/remember this[:\-]\s*(.+)/i) ||
      lower.match(/store this[:\-]\s*(.+)/i) ||
      lower.match(/this is important[:\-]\s*(.+)/i);
    if (match) {
      mem.customNotes.push({
        text: match[1].trim(),
        storedAt: new Date().toISOString(),
      });
    }

    // 11) Motivations / goals
    if (lower.includes("my goal is")) {
      const gMatch = lower.match(/my goal is (.+)/i);
      if (gMatch) mem.emotional.goals.push(gMatch[1].trim());
    }

    return mem;
  });
};
