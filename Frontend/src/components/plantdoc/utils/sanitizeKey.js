
// src/components/plantdoc/utils/sanitizeKey.js

export default function sanitizeKey(key) {
  if (!key) return "";
  return key
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}
