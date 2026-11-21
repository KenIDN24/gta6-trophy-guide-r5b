// views.js — renders every view from the guide data and the tracker state.
// Checklist with a guide pane, roadmap, missables, Next Up planner, sources, disputes.

import {
  allTrophies, trophyById, allSources, sourceById, allDisputes, roadmap,
  GRADE_ORDER, KIND_LABEL, citedSourceIds, citeHtml, esc, totalHours,
} from './data.js';
import { isEarned, setEarned, counterOf, setCounter, noteOf, setNote, earnedIds } from './store.js';

export const ui = {
  view: 'checklist', query: '', kind: 'all', grade: 'all', sort: 'roadmap',
  spoilers: false, showHidden: true, hideEarned: false, selectedId: null,
};

const GRADE_RANK = { platinum: 0, gold: 1, silver: 2, bronze: 3 };

export function visibleTrophies() {
  const q = ui.query.trim().toLowerCase();
  let list = allTrophies().filter((t) => {
    if (!ui.showHidden && t.hidden && !isEarned(t.id)) return false;
    if (ui.hideEarned && isEarned(t.id)) return false;
    if (ui.kind !== 'all' && t.kind !== ui.kind) return false;
    if (ui.grade !== 'all' && t.grade !== ui.grade) return false;
    if (q) {
      const hay = `${t.name} ${t.description} ${t.guide} ${KIND_LABEL[t.kind]}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  const by = {
    roadmap: (a, b) => a.stage - b.stage || a.id - b.id,
    name: (a, b) => a.name.localeCompare(b.name),
    grade: (a, b) => GRADE_RANK[a.grade] - GRADE_RANK[b.grade] || a.id - b.id,
    difficulty: (a, b) => b.difficulty - a.difficulty || a.id - b.id,
    hours: (a, b) => b.hours - a.hours || a.id - b.id,
  }[ui.sort];
  return list.sort(by);
}

function spoilered(t) {
  return ui.spoilers && t.kind === 'story' && !isEarned(t.id);
}

export function renderChecklist(root, onSelect) {
  root.replaceChildren();
  const list = visibleTrophies();
  if (!list.length) {
    const p = document.createElement('p');
    p.className = 'view-intro';
    p.textContent = 'No trophy matches the current filters.';
    root.append(p);
    return;
  }
  for (const t of list) {
    const row = document.createElement('div');
    row.className = 'trophy-row' + (isEarned(t.id) ? ' earned' : '') + (ui.selectedId === t.id ? ' selected' : '');
    row.setAttribute('role', 'listitem');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = isEarned(t.id);
    box.setAttribute('aria-label', `mark ${t.name} earned`);
    box.addEventListener('change', () => { setEarned(t.id, box.checked); onSelect(t.id, true); });
    const medal = document.createElement('span');
    medal.className = `medal ${t.grade}`;
    const main = document.createElement('button');
    main.type = 'button';
    main.style.cssText = 'background:none;border:0;text-align:left;padding:0;cursor:pointer;color:inherit';
    if (spoilered(t)) main.classList.add('spoilered');
    main.innerHTML = `<span class="row-name">${spoilered(t) ? 'Hidden story trophy' : esc(t.name)}</span>
      <span class="row-desc">${spoilered(t) ? 'Earn it to lift the spoiler shield.' : esc(t.description)}</span>
      <span class="row-tags">
        <span class="tag kind">${KIND_LABEL[t.kind]}</span>
        <span class="tag">${t.grade}</span>
        ${t.missable ? '<span class="tag miss">MISSABLE</span>' : ''}
        ${t.hidden ? '<span class="tag hid">hidden on PSN</span>' : ''}
        <span class="tag">Stage ${t.stage}</span>
        ${t.count ? `<span class="tag">${counterOf(t.id)}/${t.count} ${esc(t.countLabel)}</span>` : ''}
      </span>`;
    main.addEventListener('click', () => onSelect(t.id, false));
    const meta = document.createElement('div');
    meta.className = 'row-meta';
    meta.innerHTML = `<span class="diff" title="difficulty">${'●'.repeat(t.difficulty)}${'○'.repeat(5 - t.difficulty)}</span><br>≈${t.hours}h`;
    row.append(box, medal, main, meta);
    root.append(row);
  }
}

export function renderDetail(body, empty, trophy, refresh) {
  if (!trophy) { body.hidden = true; empty.hidden = false; return; }
  empty.hidden = true;
  body.hidden = false;
  const hidden = spoilered(trophy);
  const cited = citedSourceIds(trophy);
  const pct = trophy.count ? Math.min(100, Math.round((counterOf(trophy.id) / trophy.count) * 100)) : 0;
  body.innerHTML = `
    <h2>${hidden ? 'Hidden story trophy' : esc(trophy.name)}</h2>
    <p class="d-desc">${hidden ? 'The spoiler shield is on: this story trophy shows itself once earned.' : `“${esc(trophy.description)}”`}</p>
    <div class="d-meta">
      <span class="tag">${trophy.grade}</span>
      <span class="tag kind">${KIND_LABEL[trophy.kind]}</span>
      <span class="tag">Stage ${trophy.stage} of 7</span>
      <span class="tag">≈${trophy.hours}h</span>
      <span class="tag">difficulty ${trophy.difficulty}/5</span>
      ${trophy.hidden ? '<span class="tag hid">hidden on PSN until earned</span>' : ''}
      ${trophy.missable ? '<span class="tag miss">MISSABLE</span>' : ''}
    </div>
    ${trophy.missable ? `<div class="ponr-box"><strong>Point of no return.</strong> ${esc((trophy.ponr ?? '').replace(/^Point of no return:\s*/, ''))}</div>` : ''}
    <h3>The guide</h3>
    <p>${citeHtml(trophy.guide)}</p>
    ${trophy.count ? `<div class="counter-box">
        <button type="button" id="ctr-down" aria-label="decrease counter">−</button>
        <div class="counter-bar"><div class="counter-fill" style="width:${pct}%"></div></div>
        <strong>${counterOf(trophy.id)} / ${trophy.count}</strong><span>${esc(trophy.countLabel)}</span>
        <button type="button" id="ctr-up" aria-label="increase counter">+</button>
      </div>` : ''}
    <h3>Steps — every one cited</h3>
    <ol class="steps">${trophy.steps.map((s) => `<li>${citeHtml(s)}</li>`).join('')}</ol>
    <h3>Sources for this trophy</h3>
    <ul class="src-list">${cited.map((id) => `<li><strong>[${id}]</strong> ${esc(sourceById(id)?.name ?? id)}</li>`).join('')}</ul>
    <h3>Your notes</h3>
    <textarea id="note-box" placeholder="Your own notes for this trophy — saved in this browser.">${esc(noteOf(trophy.id))}</textarea>
    <p><label><input type="checkbox" id="detail-earned" ${isEarned(trophy.id) ? 'checked' : ''}> Earned</label></p>`;
  body.querySelector('#detail-earned').addEventListener('change', (e) => { setEarned(trophy.id, e.target.checked); refresh(); });
  body.querySelector('#note-box').addEventListener('change', (e) => setNote(trophy.id, e.target.value));
  const up = body.querySelector('#ctr-up');
  if (up) {
    up.addEventListener('click', () => { setCounter(trophy.id, counterOf(trophy.id) + 1); refresh(); });
    body.querySelector('#ctr-down').addEventListener('click', () => { setCounter(trophy.id, counterOf(trophy.id) - 1); refresh(); });
  }
}

export function renderSummary() {
  const earned = earnedIds().size;
  document.getElementById('earned-count').textContent = earned;
  const left = allTrophies().filter((t) => !isEarned(t.id)).reduce((s, t) => s + t.hours, 0);
  document.getElementById('eta-hours').textContent = `≈${Math.round(totalHours())}h`;
  document.getElementById('eta-left').textContent = `${Math.round(left)}h to go`;
  const counts = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  const totals = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of allTrophies()) { totals[t.grade] += 1; if (isEarned(t.id)) counts[t.grade] += 1; }
  document.getElementById('grade-line').innerHTML = Object.keys(totals)
    .map((g) => `<span class="grade-pill">${g} <b>${counts[g]}/${totals[g]}</b></span>`).join('');
}

export function renderRoadmap(root, onSelect) {
  root.replaceChildren();
  const intro = document.createElement('p');
  intro.className = 'view-intro';
  intro.innerHTML = 'The road to <strong>Vice Got a Price!</strong> — seven stages, built from the official descriptions: story first while the missable windows are open, counted grinds in parallel, 100% last. Times are this guide’s route estimates [S19].';
  root.append(intro);
  for (const stage of roadmap()) {
    const trophies = stage.trophies.map(trophyById);
    const done = trophies.filter((t) => isEarned(t.id)).length;
    const card = document.createElement('article');
    card.className = 'stage-card';
    card.innerHTML = `
      <div class="stage-head"><h3>Stage ${stage.stage} — ${esc(stage.title)}</h3><span class="stage-hours">${done}/${trophies.length} · ≈${stage.hours}h</span></div>
      <div class="stage-bar"><div class="stage-fill" style="width:${Math.round((done / trophies.length) * 100)}%"></div></div>
      <p class="stage-summary">${citeHtml(stage.summary)}</p>
      <p class="stage-notes">${citeHtml(stage.notes)}</p>
      <div class="stage-chips">${trophies.map((t) => `<button type="button" data-tid="${t.id}" class="${isEarned(t.id) ? 'done' : ''}">${esc(t.name)}</button>`).join('')}</div>`;
    card.querySelectorAll('[data-tid]').forEach((b) => b.addEventListener('click', () => onSelect(Number(b.dataset.tid), false)));
    root.append(card);
  }
}

export function renderMissables(root, onSelect) {
  root.replaceChildren();
  const intro = document.createElement('p');
  intro.className = 'view-intro';
  intro.innerHTML = 'Six trophies can be missed for good on a single save. Each is flagged from the official descriptions — a story-bound moment that does not repeat — with its point of no return in plain words.';
  root.append(intro);
  for (const t of allTrophies().filter((x) => x.missable)) {
    const card = document.createElement('article');
    card.className = 'miss-card';
    card.innerHTML = `
      <h3>${esc(t.name)} <span class="tag miss">MISSABLE</span> <span class="tag">Stage ${t.stage}</span></h3>
      <p class="d-desc">“${esc(t.description)}”</p>
      <div class="ponr-box"><strong>Point of no return.</strong> ${esc((t.ponr ?? '').replace(/^Point of no return:\s*/, ''))}</div>
      <p>${citeHtml(t.guide)}</p>
      <p><button type="button" data-open="${t.id}">Open the full guide</button></p>`;
    card.querySelector('[data-open]').addEventListener('click', () => onSelect(t.id, false));
    root.append(card);
  }
}

export function renderNextUp(root, onSelect) {
  root.replaceChildren();
  const intro = document.createElement('p');
  intro.className = 'view-intro';
  intro.innerHTML = 'The planner: missables whose windows are open first, then the cheapest unearned trophies on the current stage of the road.';
  root.append(intro);
  const unearned = allTrophies().filter((t) => !isEarned(t.id));
  const currentStage = Math.min(...unearned.map((t) => t.stage), 7);
  const picks = [
    ...unearned.filter((t) => t.missable && t.stage <= currentStage + 1)
      .map((t) => ({ t, why: `Missable, and its window is in stage ${t.stage} — take it before the story moves on.` })),
    ...unearned.filter((t) => !t.missable && t.stage === currentStage)
      .sort((a, b) => a.hours - b.hours)
      .map((t) => ({ t, why: `Stage ${t.stage} of the roadmap, ≈${t.hours}h — the cheapest step forward right now.` })),
    ...unearned.filter((t) => !t.missable && t.count && counterOf(t.id) > 0)
      .map((t) => ({ t, why: `Counter already moving: ${counterOf(t.id)}/${t.count} ${t.countLabel}. Keep it warm.` })),
  ].filter((p, i, arr) => arr.findIndex((x) => x.t.id === p.t.id) === i).slice(0, 6);
  for (const { t, why } of picks) {
    const card = document.createElement('article');
    card.className = 'next-card';
    card.innerHTML = `<h3>${esc(t.name)} <span class="tag">${t.grade}</span> <span class="tag kind">${KIND_LABEL[t.kind]}</span></h3>
      <p class="why">${esc(why)}</p>
      <p><button type="button" data-open="${t.id}">Open guide</button></p>`;
    card.querySelector('[data-open]').addEventListener('click', () => onSelect(t.id, false));
    root.append(card);
  }
  if (!picks.length) {
    const p = document.createElement('p');
    p.textContent = 'Nothing left to plan — the platinum is earned. Congratulations, Legend.';
    root.append(p);
  }
}

export function renderSources(root) {
  root.replaceChildren();
  const intro = document.createElement('p');
  intro.className = 'view-intro';
  intro.innerHTML = 'Every fact in this guide traces to one of these named sources. The official list itself is [S1]–[S3]; strategy is credited to the guide or index that published it; this guide’s own synthesis is [S19] and its dispute rulings [S48].';
  root.append(intro);
  for (const s of allSources()) {
    const card = document.createElement('article');
    card.className = 'src-card';
    card.innerHTML = `<h3>[${s.id}] ${esc(s.name)}</h3><p>${esc(s.detail)}</p>`;
    root.append(card);
  }
}

export function renderDisputes(root) {
  root.replaceChildren();
  const intro = document.createElement('p');
  intro.className = 'view-intro';
  intro.innerHTML = 'Where the community argued, this guide ruled — from the wording of the official descriptions first, and it says which sources settled each question.';
  root.append(intro);
  for (const d of allDisputes()) {
    const card = document.createElement('article');
    card.className = 'dis-card';
    card.innerHTML = `<h3>[${d.id}] ${esc(d.topic)}</h3>
      <p class="claim"><strong>The argument:</strong> ${esc(d.claim)}</p>
      <p class="resolution"><strong>The ruling:</strong> ${citeHtml(d.resolution)}</p>
      <p class="claim">Concerns: ${d.trophies.map((id) => esc(trophyById(id)?.name ?? id)).join(' · ')}</p>`;
    root.append(card);
  }
}
