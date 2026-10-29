/**
 * Human pace for every module. Clicks land on the target with no mouse-move
 * animation. Gaps stay inside a human band, uneven, and never robotic.
 * Page-load settles, batch rests, caps, and the captcha multiplier stay.
 */

export const PROFILES = {
  safe: {
    clickMin: 700,
    clickMax: 1500,
    longChance: 0.18,
    longMin: 1800,
    longMax: 4000,
    typeMin: 70,
    typeMax: 160,
    pageMin: 1500,
    pageMax: 4000,
  },
  normal: {
    clickMin: 300,
    clickMax: 1500,
    longChance: 0.12,
    longMin: 1600,
    longMax: 3200,
    typeMin: 45,
    typeMax: 130,
    pageMin: 800,
    pageMax: 2500,
  },
  fast: {
    clickMin: 300,
    clickMax: 900,
    longChance: 0.08,
    longMin: 1100,
    longMax: 2000,
    typeMin: 35,
    typeMax: 90,
    pageMin: 500,
    pageMax: 1500,
  },
};

export function mulberry32(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function whole(random, min, max) {
  return min + Math.floor(random() * (max - min + 1));
}

function uneven(random, min, max, longChance, longMin, longMax, last) {
  const roll = random();
  let gap;
  if (roll < longChance) {
    gap = whole(random, longMin, longMax);
  } else {
    const span = Math.max(1, max - min);
    const quick = random() < 0.62;
    const base = quick
      ? whole(random, min, min + Math.floor(span * 0.45))
      : whole(random, min + Math.floor(span * 0.45), max);
    const jitter = Math.round((random() - 0.5) * span * 0.18);
    gap = Math.min(max, Math.max(min, base + jitter));
  }
  if (last != null && gap === last) gap += 17 + whole(random, 0, 40);
  if (gap < min && roll >= longChance) gap = min;
  return gap;
}

export function clickGap(profileName, random, last, multiplier = 1) {
  const profile = PROFILES[profileName] || PROFILES.normal;
  const gap = uneven(
    random,
    profile.clickMin,
    profile.clickMax,
    profile.longChance,
    profile.longMin,
    profile.longMax,
    last,
  );
  return Math.max(profile.clickMin, Math.round(gap * multiplier));
}

export function pageGap(profileName, random, multiplier = 1) {
  const profile = PROFILES[profileName] || PROFILES.normal;
  const gap = uneven(random, profile.pageMin, profile.pageMax, profile.longChance, profile.pageMax, profile.pageMax + 800, null);
  return Math.max(profile.pageMin, Math.round(gap * multiplier));
}

export function typePlan(profileName, text, random, multiplier = 1) {
  const profile = PROFILES[profileName] || PROFILES.normal;
  const chars = [...String(text)];
  const perChar = [];
  let last = null;
  for (const char of chars) {
    let gap = uneven(random, profile.typeMin, profile.typeMax, 0.06, profile.typeMax, profile.typeMax + 90, last);
    if (char === " ") gap += whole(random, 40, 140);
    gap = Math.max(profile.typeMin, Math.round(gap * multiplier));
    perChar.push(gap);
    last = gap;
  }
  return { perChar, total: perChar.reduce((sum, value) => sum + value, 0) };
}

export function batchRestMs(random, multiplier = 1) {
  return whole(random, 120000, 300000) * multiplier;
}

export function redDotExpression(x, y) {
  const left = Number(x);
  const top = Number(y);
  if (!Number.isFinite(left) || !Number.isFinite(top)) return "";
  return `(() => { const dot = document.createElement("div"); dot.setAttribute("data-pace-dot","1"); Object.assign(dot.style, { position:"fixed", left:"${left}px", top:"${top}px", width:"14px", height:"14px", borderRadius:"50%", background:"#e10600", transform:"translate(-50%,-50%)", zIndex:"2147483647", pointerEvents:"none" }); document.documentElement.appendChild(dot); setTimeout(() => dot.remove(), 180); })()`;
}
