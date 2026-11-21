// data.js — loads app/data/trophies.json once and builds the indexes every view reads.
// The JSON is the guide's single source of truth: trophies, sources, disputes, roadmap.

export const GRADE_ORDER = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
export const KIND_LABEL = {
  story: 'Story', missable: 'Missable', collectibles: 'Collectibles',
  activities: 'Activities', partner: 'Partner',
};

let doc = null;
const byId = new Map();
const sourceMap = new Map();

export async function loadGuide() {
  const response = await fetch('data/trophies.json');
  doc = await response.json();
  for (const t of doc.trophies) byId.set(t.id, t);
  for (const s of doc.sources) sourceMap.set(s.id, s);
  return doc;
}

export function guideDoc() { return doc; }
export function allTrophies() { return doc.trophies; }
export function trophyById(id) { return byId.get(id); }
export function allSources() { return doc.sources; }
export function sourceById(id) { return sourceMap.get(id); }
export function allDisputes() { return doc.disputes; }
export function roadmap() { return doc.roadmap; }

export function totalHours() {
  return doc.trophies.reduce((sum, t) => sum + t.hours, 0);
}

// The audit strip is computed from the data, never typed by hand:
// cited steps = steps carrying at least one [S#] tag; every step must carry one.
export function auditCounts() {
  let steps = 0, cited = 0;
  for (const t of doc.trophies) {
    for (const step of t.steps) {
      steps += 1;
      if (/\[S\d+\]/.test(step)) cited += 1;
    }
  }
  return {
    steps, cited,
    sources: doc.sources.length,
    disputes: doc.disputes.length,
    missables: doc.trophies.filter((t) => t.missable).length,
    hidden: doc.trophies.filter((t) => t.hidden).length,
  };
}

// Render a step or guide paragraph with its [S#] tags as citation chips.
export function citeHtml(text) {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/\[(S\d+)\]/g, '<span class="cite">[$1]</span>');
}

export function esc(text) {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

// Every [S#] a trophy's guide and steps cite, in first-use order.
export function citedSourceIds(trophy) {
  const seen = [];
  const text = [trophy.guide, ...trophy.steps].join('\n');
  for (const m of text.matchAll(/\[(S\d+)\]/g)) {
    if (!seen.includes(m[1])) seen.push(m[1]);
  }
  return seen;
}
