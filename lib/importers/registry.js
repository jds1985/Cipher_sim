// lib/importers/registry.js

import { chatgptImporter } from "./sources/chatgpt";
import { claudeImporter } from "./sources/claude";
import { genericImporter } from "./sources/generic";

const IMPORTERS = [chatgptImporter, claudeImporter, genericImporter];

export function detectImporter(raw) {
  for (const imp of IMPORTERS) {
    try {
      if (imp.canParse(raw)) return imp;
    } catch (e) {
      // ignore and keep trying
    }
  }
  return genericImporter;
}
