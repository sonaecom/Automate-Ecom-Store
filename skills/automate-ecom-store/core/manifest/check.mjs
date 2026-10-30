/** Module manifest contract. No network and no JSON-schema package. */

const PLATFORMS = new Set(["shopee", "tiktokshop", "lazada"]);
const RISK = new Set(["low", "medium", "high"]);

export function checkManifest(manifest) {
  if (!manifest || typeof manifest !== "object") return "manifest must be an object";
  for (const key of ["id", "platforms", "markets", "writes", "money", "priority", "cost", "input", "output", "policyTags"]) {
    if (manifest[key] === undefined) return `missing ${key}`;
  }
  if (typeof manifest.id !== "string" || !manifest.id.trim()) return "id must be a string";
  if (!Array.isArray(manifest.platforms) || manifest.platforms.length === 0) return "platforms must be a list";
  if (manifest.platforms.some((item) => !PLATFORMS.has(item))) return "platform must be shopee, tiktokshop, or lazada";
  if (!Array.isArray(manifest.markets)) return "markets must be a list";
  if (typeof manifest.writes !== "boolean" || typeof manifest.money !== "boolean") return "writes and money must be booleans";
  if (!Number.isInteger(manifest.priority) || manifest.priority < 0 || manifest.priority > 4) return "priority must be 0 to 4";
  if (!manifest.cost || !Number.isInteger(manifest.cost.actions) || !RISK.has(manifest.cost.captchaRisk)) {
    return "cost needs actions and captchaRisk";
  }
  if (typeof manifest.input !== "string" || typeof manifest.output !== "string") return "input and output must be strings";
  if (!Array.isArray(manifest.policyTags)) return "policyTags must be a list";
  return "";
}
