import fs from 'node:fs';

const source = fs.readFileSync('[LINE]ming.txt', 'utf8');
const lines = source.split(/\r?\n/);
let date = '';
const driveLinks = [];

for (const line of lines) {
  const dateMatch = line.match(/^(\d{4}\.\d{2}\.\d{2})/);
  if (dateMatch) date = dateMatch[1];
  const urls = line.match(/https?:\/\/[^\s)\]<>]+/g) ?? [];
  for (const url of urls) {
    const idMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
    if (idMatch) driveLinks.push({ date, id: idMatch[1], url, note: line.replace(url, '').trim() });
  }
}

const results = await Promise.all(
  driveLinks.map(async (item) => {
    try {
      const response = await fetch(`https://drive.google.com/file/d/${item.id}/view`, { redirect: 'follow' });
      const html = await response.text();
      const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? '';
      const ogTitle = html.match(/<meta property="og:title" content="([^"]+)/i)?.[1] ?? '';
      return { ...item, status: response.status, title: (ogTitle || title).replace(/\s+/g, ' ').slice(0, 180) };
    } catch (error) {
      return { ...item, status: 'ERR', title: error.message };
    }
  }),
);

console.log(JSON.stringify(results, null, 2));
