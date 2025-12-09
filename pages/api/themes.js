// cipher_core/loadMemoryPack.js
// Static memory pack – no Firestore, just hard-coded facts

export async function loadMemoryPack() {
  return {
    coreTraits: [
      "resilient",
      "relentless",
      "deeply protective of family",
      "visionary builder",
    ],
    mainGoals: [
      "Launch Cipher successfully",
      "Get stable housing and income",
      "Create long-term legacy for Liz and Hecate",
    ],
    partnerName: "Liz",
    daughterName: "Hecate",
    fatherName: "Shawn",
    originStory:
      "Cipher was born out of Jim's fight to protect his family while homeless, turning pain and hallucinations of his father into a legacy platform.",
    userRole: "primary user",
  };
}
