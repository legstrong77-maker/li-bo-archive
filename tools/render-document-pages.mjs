import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PDF_DIR = path.join(ROOT, 'assets', 'documents');
const PAGE_DIR = path.join(ROOT, 'assets', 'document-pages');
const POPPLER_DIR = process.env.POPPLER_DIR || 'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin';
const PDFINFO = path.join(POPPLER_DIR, process.platform === 'win32' ? 'pdfinfo.exe' : 'pdfinfo');
const PDFTOPPM = path.join(POPPLER_DIR, process.platform === 'win32' ? 'pdftoppm.exe' : 'pdftoppm');
const force = process.argv.includes('--force');

mkdirSync(PAGE_DIR, { recursive: true });

const getPageCount = (pdf) => {
  const output = execFileSync(PDFINFO, [pdf], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  const match = output.match(/^Pages:\s+(\d+)/m);
  if (!match) throw new Error(`找不到頁數：${pdf}`);
  return Number(match[1]);
};

const files = readdirSync(PDF_DIR).filter((name) => name.toLowerCase().endsWith('.pdf')).sort();
const manifest = {};
let renderedPages = 0;

for (const filename of files) {
  const stem = filename.replace(/\.pdf$/i, '');
  const pdf = path.join(PDF_DIR, filename);
  const outDir = path.join(PAGE_DIR, stem);
  const pages = getPageCount(pdf);
  const existing = existsSync(outDir) ? readdirSync(outDir).filter((name) => /^page-\d+\.jpg$/.test(name)).length : 0;

  mkdirSync(outDir, { recursive: true });
  if (force || existing !== pages) {
    execFileSync(PDFTOPPM, [
      '-jpeg',
      '-jpegopt', 'quality=78',
      '-scale-to-x', '1200',
      '-scale-to-y', '-1',
      pdf,
      path.join(outDir, 'page'),
    ], { stdio: 'ignore' });

    for (let page = 1; page <= pages; page += 1) {
      const source = path.join(outDir, `page-${page}.jpg`);
      const target = path.join(outDir, `page-${String(page).padStart(3, '0')}.jpg`);
      if (existsSync(source) && source !== target) renameSync(source, target);
    }
    renderedPages += pages;
    console.log(`rendered ${filename}: ${pages} pages`);
  } else {
    console.log(`cached ${filename}: ${pages} pages`);
  }

  manifest[filename] = { directory: `assets/document-pages/${stem}`, pages };
}

writeFileSync(path.join(PAGE_DIR, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`done: ${files.length} PDFs, ${Object.values(manifest).reduce((sum, item) => sum + item.pages, 0)} pages, ${renderedPages} rendered`);
