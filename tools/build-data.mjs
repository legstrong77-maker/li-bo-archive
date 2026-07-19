import fs from 'node:fs';

const source = fs.readFileSync('[LINE]ming.txt', 'utf8');
const lines = source.split(/\r?\n/);
let date = '';
let lastSpeaker = '';
const timeline = [];
const resources = [];
const seen = new Set();

for (const rawLine of lines) {
  const dateMatch = rawLine.match(/^(\d{4}\.\d{2}\.\d{2})\s*(.*)$/);
  if (dateMatch) {
    date = dateMatch[1];
    lastSpeaker = '';
    timeline.push({ date, weekday: dateMatch[2], text: [], links: [] });
    continue;
  }
  if (!date) continue;
  const current = timeline[timeline.length - 1];
  const speakerMatch = rawLine.match(/^\d{2}:\d{2}\s+([^\s]+)\s+(.*)$/);
  if (speakerMatch) lastSpeaker = speakerMatch[1];
  const isMing = speakerMatch ? speakerMatch[1] === 'ming' : lastSpeaker === 'ming';
  if (!isMing) continue;
  const urls = rawLine.match(/https?:\/\/[^\s)\]<>]+/g) ?? [];
  const cleaned = (speakerMatch ? speakerMatch[2] : rawLine).trim();
  if (cleaned && cleaned !== '圖片') current.text.push(cleaned.replace(/\s+/g, ' '));
  for (const url of urls) {
    if (!seen.has(url)) {
      seen.add(url);
      const driveId = url.match(/drive\.google\.com\/file\/d\/([^/]+)/)?.[1] ?? null;
      const youtubeId = url.match(/youtu\.be\/([^?]+)/)?.[1] ?? url.match(/[?&]v=([^&]+)/)?.[1] ?? null;
      resources.push({ date, url, driveId, youtubeId, note: cleaned.replace(url, '').trim() });
    }
    current.links.push(url);
  }
}

const driveResources = resources.filter((item) => item.driveId);
const titled = await Promise.all(driveResources.map(async (item) => {
  try {
    const response = await fetch(`https://drive.google.com/file/d/${item.driveId}/view`, { redirect: 'follow' });
    const html = await response.text();
    const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? '';
    const ogTitle = html.match(/<meta property="og:title" content="([^"]+)/i)?.[1] ?? '';
    return { ...item, title: (ogTitle || title).replace(/\s+/g, ' ').replace(/ - Google Drive$/, '') };
  } catch {
    return { ...item, title: '李博分享檔案' };
  }
}));

const finalResources = resources.map((item) => {
  const titledItem = titled.find((candidate) => candidate.url === item.url);
  const overrides = {
    'https://docs.google.com/presentation/d/14L0RLAsQFyq0Yn_MrbBE-lJ7zcDSql6A/edit?usp=drive_link&ouid=109679228424215533041&rtpof=true&sd=true': { title: '爸爸帶我去南極玩（簡報版）', kind: 'document', category: '旅行與山', localFile: 'assets/documents/antarctica-slides.pdf' },
    'https://chemistry.org.tw/index.php': { title: '台灣化學學會｜CST', category: '科技與時代', localFile: 'assets/snapshots/chemistry.html' },
    'https://islandnation.oen.tw/': { title: '軍事電影《國運之戰》製作費集資', category: '生活觀察', localFile: 'assets/snapshots/islandnation.html' },
    'https://www.facebook.com/share/p/1ALKq48VkV/': { title: '1996 台海危機與金門工六火箭', category: '科技與時代', note: '李博分享一則關於 1996 台海危機、金門工六火箭與自身軍旅經驗的貼文。' },
    'https://www.instagram.com/reel/DMpYjPHNEMk/?igsh=MWlka2hvdnViMHYxdg==': { title: 'TASA｜首屆台灣盃火箭競賽', category: '科技與時代', note: '李博分享 TASA 首屆台灣盃火箭競賽，青年點燃太空夢想的影像。' },
    'https://share.google/43weoMGsDyWECx1LS': { title: 'TASA｜首屆台灣盃火箭競賽圓滿閉幕', category: '科技與時代', note: '青年點燃太空夢想，李博留下的新聞分享。' },
    'https://share.google/ZsqLbB5wCNDEPzrwh': { title: '紀錄片《神木之島》上映首日', category: '生活觀察', note: '上映首日票房掛零，導演說：努力不夠。李博留下的片單與觀察。' },
  }[item.url] || {};
  const title = overrides.title || titledItem?.title || item.note || (item.youtubeId ? '李博分享影片' : item.url);
  const kind = overrides.kind || (item.driveId ? 'document' : item.youtubeId ? 'video' : 'link');
  const category = overrides.category || (/南極|澳洲|摩洛哥|甘卓萬|關山|南湖/.test(title) ? '旅行與山' : /公益|年終|尾牙|教學|品質|培訓/.test(title) ? '工作與人' : /chemical|化學|火箭|半導體|AI|桌曆/.test(`${title}${item.note}`) ? '科技與時代' : '生活觀察');
  return { ...item, ...overrides, title, kind, category, note: overrides.note || item.note, localFile: overrides.localFile || (item.driveId ? `assets/documents/${item.driveId}.pdf` : null), thumbnail: item.driveId ? `https://drive.google.com/thumbnail?id=${item.driveId}&sz=w1200` : item.youtubeId ? `https://i.ytimg.com/vi/${item.youtubeId}/hqdefault.jpg` : null };
});

const output = `window.ARCHIVE_DATA = ${JSON.stringify({ timeline, resources: finalResources }, null, 2)};\n`;
fs.writeFileSync('archive-data.js', output, 'utf8');
console.log(`wrote archive-data.js with ${timeline.length} dates and ${finalResources.length} unique links`);
