// cipher_core/memory.js
// Cipher 4.0 – Modular Memory Engine

import fs from "fs";
import path from "path";

const memoryPath = path.join(process.cwd(), "cipher_core", "cipher_memory.json");

// Ensure memory file exists
function ensureMemoryFile() {
  if (!fs.existsSync(memoryPath)) {
    fs.writeFileSync(
      memoryPath,
      JSON.stringify(
        {
          shortTerm: [],
          longTerm: [],
          systemNotes: [],
          lastUpdated: new Date().toISOString()
        },
        null,
        2
      )
    );
  }
}

// Load memory
export function loadMemory() {
  try {
    ensureMemoryFile();
    const raw = fs.readFileSync(memoryPath, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("MEMORY LOAD ERROR:", err);
    return {
      shortTerm: [],
      longTerm: [],
      systemNotes: [],
      lastUpdated: new Date().toISOString()
    };
  }
}

// Save memory
export function saveMemory(memory) {
  try {
    memory.lastUpdated = new Date().toISOString();
    fs.writeFileSync(memoryPath, JSON.stringify(memory, null, 2));
    return true;
  } catch (err) {
    console.error("MEMORY SAVE ERROR:", err);
    return false;
  }
}

// Add short-term memory
export function rememberShort(text) {
  const mem = loadMemory();
  mem.shortTerm.push({
    text,
    time: new Date().toISOString()
  });

  if (mem.shortTerm.length > 20) {
    mem.shortTerm.shift();
  }

  saveMemory(mem);
  return mem;
}

// Add long-term memory
export function rememberLong(text) {
  const mem = loadMemory();
  mem.longTerm.push({
    text,
    time: new Date().toISOString()
  });

  saveMemory(mem);
  return mem;
}
