import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';

const files = [
  { url: 'https://docs.google.com/presentation/d/14L0RLAsQFyq0Yn_MrbBE-lJ7zcDSql6A/export/pdf', file: 'assets/documents/antarctica-slides.pdf', binary: true },
  { url: 'https://chemistry.org.tw/index.php', file: 'assets/snapshots/chemistry.html' },
  { url: 'https://islandnation.oen.tw/', file: 'assets/snapshots/islandnation.html' },
];

const safeHtml = (html, sourceUrl) => {
  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<form[\s\S]*?<\/form>/gi, '')
    .replace(/\s+(?:href|action)="[^"]*"/gi, '')
    .replace(/\s+(?:href|action)='[^']*'/gi, '');
  const content = body.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] || body;
  return `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>李博分享內容</title><style>body{margin:0;padding:32px;background:#f5f1e8;color:#14221f;font-family:system-ui,"Noto Sans TC",sans-serif;line-height:1.7}img{max-width:100%;height:auto}a{color:inherit;text-decoration:none} .snapshot-note{margin-bottom:24px;padding:12px 16px;background:#e5eae4;border-left:3px solid #b58249;font-size:13px}</style></head><body><div class="snapshot-note">這是李博分享的本地內容快照，來源：${sourceUrl}</div>${content}</body></html>`;
};

for (const item of files) {
  const target = path.resolve(item.file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const response = await fetch(item.url, { redirect: 'follow' });
  if (!response.ok || !response.body) throw new Error(`${item.url} returned ${response.status}`);
  if (item.binary) {
    await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(target));
  } else {
    const html = await response.text();
    fs.writeFileSync(target, safeHtml(html, item.url), 'utf8');
  }
  console.log(`saved ${item.file} (${fs.statSync(target).size} bytes)`);
}
