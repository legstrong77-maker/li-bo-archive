import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';

const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync('archive-data.js', 'utf8'), context);
const docs = context.window.ARCHIVE_DATA.resources.filter((item) => item.driveId);
const directory = path.resolve('assets/documents');
fs.mkdirSync(directory, { recursive: true });

const extractConfirmDownload = (html) => {
  const action = html.match(/<form[^>]+action="([^"]+)"/i)?.[1] || 'https://drive.usercontent.google.com/download';
  const inputs = [...html.matchAll(/<input[^>]+name="([^"]+)"[^>]+value="([^"]*)"/gi)];
  const params = new URLSearchParams(inputs.map((match) => [match[1], match[2]]));
  return `${action}?${params.toString()}`;
};

const downloadOne = async (item) => {
  const target = path.resolve(item.localFile);
  if (fs.existsSync(target) && fs.statSync(target).size > 0) return { ...item, status: 'exists', bytes: fs.statSync(target).size };
  let response = await fetch(`https://drive.google.com/uc?export=download&id=${item.driveId}`, { redirect: 'follow' });
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('text/html')) {
    const html = await response.text();
    if (!html.includes('download-form')) throw new Error(`Drive returned HTML instead of a download for ${item.title}`);
    response = await fetch(extractConfirmDownload(html), { redirect: 'follow' });
  }
  if (!response.ok || !response.body) throw new Error(`HTTP ${response.status} for ${item.title}`);
  await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(target));
  return { ...item, status: 'downloaded', bytes: fs.statSync(target).size };
};

const results = [];
for (const [index, item] of docs.entries()) {
  try {
    const result = await downloadOne(item);
    results.push(result);
    console.log(`[${index + 1}/${docs.length}] ${result.status} ${result.bytes} ${item.title}`);
  } catch (error) {
    results.push({ ...item, status: 'error', error: error.message });
    console.error(`[${index + 1}/${docs.length}] ERROR ${item.title}: ${error.message}`);
  }
}

const failed = results.filter((item) => item.status === 'error');
console.log(JSON.stringify({ count: results.length, failed: failed.map((item) => ({ title: item.title, error: item.error })), totalBytes: results.reduce((sum, item) => sum + (item.bytes || 0), 0) }, null, 2));
