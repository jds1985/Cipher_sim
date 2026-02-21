// cipher_os/runtime/sivaPolicy.js
// Tier + Privilege Policy Manifest

export const SIVA_POLICY = {
  tier: 1, // start at Tier 1
  autoApplyEnabled: false,

  tiers: {
    0: {
      name: "OBSERVE_ONLY",
      autoApply: false,
    },
    1: {
      name: "PROPOSE_ONLY",
      autoApply: false,
    },
    2: {
      name: "SAFE_FIX_AUTO",
      autoApply: true,
      allowTypes: ["SAFE_FIX"],
    },
    3: {
      name: "ROUTING_TUNE",
      autoApply: false,
    },
    4: {
      name: "AGENT_MANAGE",
      autoApply: false,
    },
    5: {
      name: "STRUCTURAL_EVOLVE",
      autoApply: false,
    },
  },

  safeFixRules: {
    maxPatchOps: 5,
    maxFileBytesDelta: 15000,
    allowedPathPrefixes: [
      "components/",
      "pages/",
      "cipher_os/utils/",
      "cipher_os/diagnostics/",
    ],
    blockedPathPrefixes: [
      "pages/api/",
      "cipher_os/runtime/",
    ],
  },

  thresholds: {
    minRuns: 12,
    promoteDeltaQuality: 0.03,
    regressDeltaQuality: -0.05,
    maxErrorRateIncrease: 0.05,
  },
};
