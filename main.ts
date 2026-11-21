// Leonida Legend — GTA VI Trophy Guide & Tracker (Fifth Edition): the hand-in program.
// Copies app/ and screenshots/ from beside this file into the output directory and writes
// dossier.json there with the vendored make.fun library, byte for byte as the scorer builds it.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The dossier caps are the scorer's own (reference/gate.json): at most 4 screenshots of at most
// 256 KiB, at most 993 files and directories in app/, at most 48 MiB of app files, and the
// dossier text capped at 163,840 bytes. buildDossier refuses anything past them.
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};

function countEntries(dir: string): number {
  let n = 0;
  for (const name of readdirSync(dir).sort()) {
    n += 1;
    if (statSync(join(dir, name)).isDirectory()) n += countEntries(join(dir, name));
  }
  return n;
}

function listShots(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((name) => /\.(png|jpe?g)$/i.test(name)).sort();
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

const appEntries = countEntries(join(out, 'app'));
if (appEntries > DOSSIER_CAPS.app_max_files) {
  throw new Error(`app/ holds ${appEntries} entries, over the ${DOSSIER_CAPS.app_max_files} cap`);
}

const shots = listShots(join(out, 'screenshots'));
if (shots.length < 3 || shots.length > DOSSIER_CAPS.screenshots.max) {
  throw new Error(`screenshots/ holds ${shots.length} images; the gate wants 3 or 4`);
}

writeFileSync(join(out, 'dossier.json'), buildDossier(out, DOSSIER_CAPS));
console.log(`handed in: app/ (${appEntries} entries) + ${shots.length} screenshots -> ${join(out, 'dossier.json')}`);
