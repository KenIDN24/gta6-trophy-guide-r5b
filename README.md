[![make.fun — gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![make.fun rank — gta6-trophy-guide-r5b](https://make.fun/badge/gta6-trophy-guide-01/KenIDN24/gta6-trophy-guide-r5b/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![make.fun reward — gta6-trophy-guide-r5b](https://make.fun/badge/gta6-trophy-guide-01/KenIDN24/gta6-trophy-guide-r5b/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

# Leonida Legend — GTA VI Trophy Guide & Tracker (Fifth Edition)

An offline guide and tracker for the 55 official PlayStation 5 trophies of
Grand Theft Auto VI, built for the make.fun bounty
[gta6-trophy-guide-01](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01).

## What is inside

- **All 55 official trophies** — names, descriptions and grades exactly as
  PlayStation publishes them (1 platinum, 2 gold, 6 silver, 46 bronze,
  28 hidden), each with a full guide in our own words.
- **306 cited steps** — every step of every guide carries its source as an
  [S#] tag, resolved against **48 named sources** in the Sources view.
- **36 disputes resolved** — the community's open arguments (missable or not?
  counts shared or not?) ruled from the wording of the official descriptions.
- **6 missables flagged**, each with its point of no return in plain words.
- **A seven-stage roadmap** to the platinum, ≈138 hours, with per-stage
  progress — story first while the missable windows are open, the counted
  grinds in parallel, 100% last.
- **A real tracker**: progress saved in localStorage, per-trophy counters for
  the counts PlayStation tracks (250 stunts, 42 range golds, $250,000
  laundered…), per-trophy notes, export/import of progress, filters by kind
  and grade, five sorts, search, a spoiler shield that hides story trophies
  until earned, a hidden-trophy switch, deep links (`#trophy-<id>`) and a
  Next Up planner.

## Run it

The app is plain static files under `app/` — no build step, no network.

```sh
node serve.ts            # serves app/ at http://localhost:8080
# or serve app/ with any static file server
```

Hand the entry in (copies `app/` and `screenshots/` to the output directory
and writes `dossier.json` with the vendored make.fun library):

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Layout

- `app/index.html`, `app/style.css` — the page and its dusk-on-the-bayou look.
- `app/js/main.js` — boot, routing, toolbar wiring.
- `app/js/data.js` — loads the data file, builds indexes, computes the audit strip.
- `app/js/store.js` — localStorage progress, counters, notes, export/import.
- `app/js/views.js` — checklist + guide pane, roadmap, missables, Next Up,
  sources and disputes views.
- `app/data/trophies.json` — the guide itself: trophies, sources, disputes, roadmap.
- `screenshots/` — four real renders of the app (checklist with the platinum
  guide open, a counted trophy's guide, the roadmap, the missables).
- `vendor/makefun-frontend.ts` — the kit's library, byte for byte unchanged.
- `main.ts` / `serve.ts` — the hand-in program and the dev server.

## License

MIT — see `LICENSE`. Trophy names and descriptions are the official
PlayStation list; all guide text is original to this entry and cites its
sources. No Rockstar Games artwork or logos are used.
