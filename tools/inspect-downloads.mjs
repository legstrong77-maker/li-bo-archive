import fs from 'node:fs';
import vm from 'node:vm';

const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync('archive-data.js', 'utf8'), context);
const docs = context.window.ARCHIVE_DATA.resources.filter((item) => item.driveId);
const results = await Promise.all(docs.map(async (item) => {
  try {
    const response = await fetch(`https://drive.google.com/uc?export=download&id=${item.driveId}`, { method: 'HEAD', redirect: 'follow' });
    const length = Number(response.headers.get('content-length') || 0);
    return { id: item.driveId, title: item.title, status: response.status, type: response.headers.get('content-type'), bytes: length };
  } catch (error) {
    return { id: item.driveId, title: item.title, status: 'ERR', type: error.message, bytes: 0 };
  }
}));

const total = results.reduce((sum, item) => sum + item.bytes, 0);
console.log(JSON.stringify({ total, count: results.length, results }, null, 2));
