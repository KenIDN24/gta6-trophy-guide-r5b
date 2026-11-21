// main.js — boot, routing between views, and the toolbar wiring for Leonida Legend.

import { loadGuide, auditCounts, trophyById } from './data.js';
import {
  ui, renderChecklist, renderDetail, renderSummary, renderRoadmap,
  renderMissables, renderNextUp, renderSources, renderDisputes,
} from './views.js';
import { exportProgress, importProgress, resetProgress } from './store.js';

const $ = (id) => document.getElementById(id);

function refresh() {
  renderSummary();
  const list = $('trophy-list');
  renderChecklist(list, selectTrophy);
  renderDetail($('detail-body'), $('detail-empty'), ui.selectedId ? trophyById(ui.selectedId) : null, refresh);
}

function selectTrophy(id, keepView) {
  ui.selectedId = id;
  if (!keepView && ui.view !== 'checklist') switchView('checklist');
  refresh();
  if (location.hash !== `#trophy-${id}`) history.replaceState(null, '', `#trophy-${id}`);
}

function switchView(name) {
  ui.view = name;
  document.querySelectorAll('#view-tabs .tab').forEach((b) => b.classList.toggle('active', b.dataset.view === name));
  for (const v of ['checklist', 'roadmap', 'missables', 'nextup', 'sources', 'disputes']) {
    $(`view-${v}`).hidden = v !== name;
  }
  $('toolbar').style.display = name === 'checklist' ? '' : 'none';
  if (name === 'roadmap') renderRoadmap($('view-roadmap'), selectTrophy);
  if (name === 'missables') renderMissables($('view-missables'), selectTrophy);
  if (name === 'nextup') renderNextUp($('view-nextup'), selectTrophy);
  if (name === 'sources') renderSources($('view-sources'));
  if (name === 'disputes') renderDisputes($('view-disputes'));
  if (name === 'checklist') refresh();
}

function fillAudit() {
  const a = auditCounts();
  $('audit-steps').textContent = a.cited;
  $('audit-sources').textContent = a.sources;
  $('audit-disputes').textContent = a.disputes;
  $('audit-missables').textContent = a.missables;
  $('audit-hidden').textContent = a.hidden;
}

function wireToolbar() {
  $('search').addEventListener('input', (e) => { ui.query = e.target.value; refresh(); });
  $('kind-chips').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-kind]');
    if (!btn) return;
    ui.kind = btn.dataset.kind;
    document.querySelectorAll('#kind-chips .chip').forEach((c) => c.classList.toggle('active', c === btn));
    refresh();
  });
  $('grade-filter').addEventListener('change', (e) => { ui.grade = e.target.value; refresh(); });
  $('sort-order').addEventListener('change', (e) => { ui.sort = e.target.value; refresh(); });
  $('spoiler-toggle').addEventListener('change', (e) => { ui.spoilers = e.target.checked; refresh(); });
  $('hidden-toggle').addEventListener('change', (e) => { ui.showHidden = e.target.checked; refresh(); });
  $('earned-toggle').addEventListener('change', (e) => { ui.hideEarned = e.target.checked; refresh(); });
  $('export-progress').addEventListener('click', exportProgress);
  $('import-progress').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) { await importProgress(file); refresh(); }
  });
  $('reset-progress').addEventListener('click', () => { resetProgress(); refresh(); });
  document.querySelectorAll('#view-tabs .tab').forEach((b) =>
    b.addEventListener('click', () => switchView(b.dataset.view)));
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== $('search')) { e.preventDefault(); $('search').focus(); }
    if (e.key === 'Escape') { ui.selectedId = null; refresh(); }
  });
}

await loadGuide();
fillAudit();
wireToolbar();
const deep = /^#trophy-(\d+)$/.exec(location.hash);
if (deep) ui.selectedId = Number(deep[1]);
refresh();
