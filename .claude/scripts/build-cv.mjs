// Construye el CV de una oferta: applications/<ID>/cv.md → .claude/templates/cv.html → <Nombre>_<Apellido>_CV_<Empresa>.pdf
// Uso: node .claude/scripts/build-cv.mjs <ID> [--keep-html]   (--keep-html deja el HTML intermedio en la carpeta temporal para revisarlo)
//
// Formato de cv.md (el agente solo escribe este archivo):
//
//   ---
//   lang: es                      # es | en
//   company: <Empresa>            # se usa en el nombre del PDF
//   ---
//   # <Nombre completo>            # nombre y apellido dan el nombre del PDF
//   <email>
//   <teléfono>
//
//   ## Sumario                    # o Career Summary
//   Párrafo...
//
//   ## Habilidades                # o Summary of Qualifications — una skill por línea
//   - <skill>
//
//   ## Idiomas                    # o Languages
//   - <idioma (nivel)>
//
//   ## Experiencia                # o Career History — un ### por cargo
//   ### <Empresa>, <Ciudad>, <País>
//   role: <cargo>
//   dates: <fechas>
//   team: <equipo>                # opcional
//
//   Párrafo 1...
//
//   Párrafo 2...
//
//   Skills: <skills del cargo>
//
//   ## Liderazgo                  # o Leadership — mismo formato, sin role
//   ## Certificaciones            # o Certifications — ### nombre, dates:, issuer:
//   ## Educación                  # o Education — ### institución, dates:, degree:

import { readFileSync, writeFileSync, existsSync, rmSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const id = process.argv[2];
if (!id) { console.error('Uso: node .claude/scripts/build-cv.mjs <ID>'); process.exit(1); }

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const dir = join(root, 'applications', id);
const mdPath = join(dir, 'cv.md');
if (!existsSync(mdPath)) { console.error(`No existe ${mdPath}`); process.exit(1); }

const SECTIONS = {
  summary: ['career summary', 'sumario'],
  skills: ['summary of qualifications', 'habilidades'],
  languages: ['languages', 'idiomas'],
  experience: ['career history', 'experiencia'],
  leadership: ['leadership', 'liderazgo'],
  certifications: ['certifications', 'certificaciones'],
  education: ['education', 'educación', 'educacion'],
};
const typeOf = title => Object.keys(SECTIONS).find(k => SECTIONS[k].includes(title.trim().toLowerCase()));
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// --- parseo ---
const raw = readFileSync(mdPath, 'utf8').replace(/\r\n/g, '\n');
const fm = {};
let body = raw;
const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n/);
if (fmMatch) {
  fmMatch[1].split('\n').forEach(l => { const m = l.match(/^(\w+):\s*(.*)$/); if (m) fm[m[1]] = m[2].trim(); });
  body = raw.slice(fmMatch[0].length);
}
if (!fm.lang || !fm.company) { console.error('cv.md necesita lang y company en el frontmatter'); process.exit(1); }

const lines = body.split('\n');
let name = '';
const contact = [];
const sections = [];
let section = null;
let entry = null;
let para = [];

const flushPara = () => {
  if (!para.length) return;
  const text = para.join(' ').trim();
  para = [];
  if (!text) return;
  const target = entry || section;
  if (!target) return;
  (target.paragraphs ||= []).push(text);
};

for (const line of lines) {
  const t = line.trim();
  if (t.startsWith('# ')) { name = t.slice(2).trim(); continue; }
  if (t.startsWith('## ')) {
    flushPara();
    const title = t.slice(3).trim();
    const type = typeOf(title);
    if (!type) { console.error(`Sección desconocida: "${title}"`); process.exit(1); }
    section = { title, type, items: [], entries: [] };
    entry = null;
    sections.push(section);
    continue;
  }
  if (!section) { if (t && name) contact.push(t); continue; }
  if (t.startsWith('### ')) { flushPara(); entry = { heading: t.slice(4).trim(), fields: {} }; section.entries.push(entry); continue; }
  if (!t) { flushPara(); continue; }
  if (t.startsWith('- ') && (section.type === 'skills' || section.type === 'languages')) { section.items.push(t.slice(2).trim()); continue; }
  const skills = t.match(/^Skills:\s*(.*)$/);
  if (skills && entry) { flushPara(); entry.skills = skills[1].trim(); continue; }
  const field = t.match(/^(role|dates|team|issuer|degree):\s*(.*)$/);
  if (field && entry && !para.length) { entry.fields[field[1]] = field[2].trim(); continue; }
  para.push(t);
}
flushPara();

// --- render ---
const row = (left, right, cls = 'row') => `<div class="${cls}"><span>${esc(left)}</span><span>${esc(right || '')}</span></div>`;
const desc = ps => ps?.length ? `<div class="desc">${ps.map(p => `<p>${esc(p)}</p>`).join('')}</div>` : '';
const skillsLine = s => s ? `<p class="skills-line">Skills: ${esc(s)}</p>` : '';

const renderSection = s => {
  const h = `<h2${s.type === 'education' ? ' class="big"' : ''}>${esc(s.title)}</h2>`;
  switch (s.type) {
    case 'summary':
      return h + (s.paragraphs || []).map(p => `<p class="summary">${esc(p)}</p>`).join('');
    case 'skills': {
      const per = Math.ceil(s.items.length / 3);
      const cols = [0, 1, 2].map(i => s.items.slice(i * per, (i + 1) * per));
      return h + '<p class="proficient">Proficient in</p><div class="skills-grid">' +
        cols.map(c => `<div><ul>${c.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`).join('') + '</div>';
    }
    case 'languages':
      return h + `<div class="langs">${s.items.map(x => `<span>● ${esc(x)}</span>`).join('')}</div>`;
    case 'experience':
      return h + s.entries.map(e => `<div class="job"><p class="company">${esc(e.heading)}</p>` +
        row(e.fields.role || '', e.fields.dates) + (e.fields.team ? `<div>${esc(e.fields.team)}</div>` : '') +
        desc(e.paragraphs) + skillsLine(e.skills) + '</div>').join('');
    case 'leadership':
      return h + s.entries.map(e => `<div class="job">${row(e.heading, e.fields.dates, 'row lead-row')}` +
        desc(e.paragraphs) + skillsLine(e.skills) + '</div>').join('');
    case 'certifications':
      return h + s.entries.map(e => `<div class="edu">${row(e.heading, e.fields.dates)}<div>${esc(e.fields.issuer || '')}</div></div>`).join('');
    case 'education':
      return h + s.entries.map(e => `<div class="edu">${row(e.heading, e.fields.dates)}<div>${esc(e.fields.degree || '')}</div></div>`).join('');
  }
};

const header = `<p class="name">${esc(name)}</p><div class="contact">${contact.map(esc).join('<br>')}</div><hr>`;
const html = readFileSync(join(root, '.claude', 'templates', 'cv.html'), 'utf8')
  .replaceAll('{{lang}}', fm.lang)
  .replaceAll('{{name}}', esc(name))
  .replace('{{body}}', header + sections.map(renderSection).join('\n'));

// --- PDF ---
const safe = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w-]+/g, '_').replace(/^_+|_+$/g, '');
// Las dos primeras palabras del nombre en cv.md forman el prefijo del PDF (ej. "Ana L\u00f3pez Ruiz" \u2192 Ana_Lopez_CV_<Empresa>.pdf)
const personName = safe(name.split(/\s+/).slice(0, 2).join(' '));
const pdf = join(dir, `${personName}_CV_${safe(fm.company)}.pdf`);
const tmpHtml = join(tmpdir(), `cv-${id}.html`);
writeFileSync(tmpHtml, html);
if (existsSync(pdf)) rmSync(pdf);

const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
spawnSync(edge, ['--headless', '--disable-gpu', '--no-pdf-header-footer', `--print-to-pdf=${pdf}`, pathToFileURL(tmpHtml).href], { stdio: 'ignore' });
if (process.argv.includes("--keep-html")) console.log(`HTML ${tmpHtml}`); else rmSync(tmpHtml, { force: true });

if (!existsSync(pdf) || statSync(pdf).size === 0) { console.error(`No se generó ${pdf}`); process.exit(1); }

// Archivos de la versión anterior del flujo
for (const legacy of ['cv.pdf', 'cv.html']) rmSync(join(dir, legacy), { force: true });

console.log(`OK ${pdf}`);
