/**
 * Per-store targets are whatever the owner typed. Ceilings are the maximum.
 * An empty target is not filled up to the ceiling. Examples such as 10% or
 * 2,000 are not defaults.
 */

export const CEILINGS = {
  invitesPerDay: 2000,
  invitesPerHour: 100,
  listingEditsPerHour: 40,
  adsChangesPerHour: 10,
  maxStores: 10,
  batchMinutesMin: 40,
  batchMinutesMax: 50,
  breakMinutesMin: 10,
  breakMinutesMax: 20,
  nightOffHours: 4,
};

export function ownerNumber(value) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  if (!text || text.includes("<")) return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

export function inviteCeiling(stage, dayIndex) {
  const day = Number.isInteger(dayIndex) && dayIndex >= 0 ? dayIndex : 0;
  if (stage === "A" || stage === "new") {
    return Math.min(CEILINGS.invitesPerDay, CEILINGS.invitesPerHour * (day + 1));
  }
  return CEILINGS.invitesPerDay;
}

export function clipWork(count, ownerTarget, ceiling) {
  const asked = ownerNumber(ownerTarget);
  const room = asked === null ? ceiling : Math.min(asked, ceiling);
  return {
    target: asked === null ? "unset" : asked,
    ceiling,
    allowed: Math.min(count, room),
    held: Math.max(0, count - room),
    clamped: asked !== null && asked > ceiling,
  };
}
