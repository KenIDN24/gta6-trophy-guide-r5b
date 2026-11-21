// store.js — the tracker state: earned trophies, per-trophy counters and notes.
// Saved in localStorage, exportable to a JSON file and importable back. Nothing leaves the browser.

const KEY = 'leonida-legend-progress-v5';

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        earned: new Set(parsed.earned ?? []),
        counters: parsed.counters ?? {},
        notes: parsed.notes ?? {},
      };
    }
  } catch { /* a corrupt save falls through to a fresh state */ }
  return { earned: new Set(), counters: {}, notes: {} };
}

function persist() {
  localStorage.setItem(KEY, JSON.stringify({
    earned: [...state.earned],
    counters: state.counters,
    notes: state.notes,
  }));
}

export function isEarned(id) { return state.earned.has(id); }
export function earnedIds() { return state.earned; }

export function setEarned(id, on) {
  if (on) state.earned.add(id); else state.earned.delete(id);
  persist();
}

export function counterOf(id) { return state.counters[id] ?? 0; }
export function setCounter(id, value) {
  state.counters[id] = Math.max(0, value);
  persist();
}

export function noteOf(id) { return state.notes[id] ?? ''; }
export function setNote(id, text) {
  if (text) state.notes[id] = text; else delete state.notes[id];
  persist();
}

export function exportProgress() {
  const blob = new Blob([JSON.stringify({
    app: 'leonida-legend', version: 5,
    earned: [...state.earned], counters: state.counters, notes: state.notes,
  }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'leonida-legend-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

export async function importProgress(file) {
  const parsed = JSON.parse(await file.text());
  state = {
    earned: new Set(parsed.earned ?? []),
    counters: parsed.counters ?? {},
    notes: parsed.notes ?? {},
  };
  persist();
}

export function resetProgress() {
  state = { earned: new Set(), counters: {}, notes: {} };
  persist();
}
