#!/usr/bin/env node
/*
  Usage (expect to run in your Foundry server or via Node with the JSON actor exports):
  Node script to scan exported actors JSON in a world actors folder for invalid or HTML-wrapped image fields.
*/
const fs = require('fs');
const path = require('path');

function extractImageUrl(value) {
  if (!value || typeof value !== 'string') return null;
  const s = value.trim();
  const imgMatch = s.match(/<img\s+[^>]*src\s*=\s*(['"])(.*?)\1/i);
  if (imgMatch && imgMatch[2]) return imgMatch[2];
  const imgMatch2 = s.match(/<img\s+[^>]*src\s*=\s*([^\s'>]+)/i);
  if (imgMatch2 && imgMatch2[1]) return imgMatch2[1];
  if (/\.(png|jpg|jpeg|svg|webp|gif|bmp)(\?.*)?$/i.test(s)) return s.replace(/["'<>]/g, '');
  const cleaned = s.replace(/[<>"']/g, '');
  if (cleaned.includes('/') || cleaned.includes(':')) return cleaned;
  return null;
}

const dir = process.argv[2] || '.';
const abs = path.resolve(dir);
if (!fs.existsSync(abs)) { console.error('Path does not exist:', abs); process.exit(2); }

const files = fs.readdirSync(abs).filter(f => f.endsWith('.json'));
if (!files.length) { console.error('No JSON actor files found in path:', abs); process.exit(1); }

for (const f of files) {
  const full = path.join(abs, f);
  try {
    const data = JSON.parse(fs.readFileSync(full, 'utf8'));
    const name = data.name || f;
    const actorImg = data.img;
    const tokenImg = data.prototypeToken && data.prototypeToken.texture && data.prototypeToken.texture.src;
    const used = extractImageUrl(tokenImg) || extractImageUrl(actorImg) || null;
    if (!used) {
      console.log(`[WARN] ${name} -> tokenImg: ${tokenImg}, actorImg: ${actorImg}`);
    } else {
      console.log(`[OK] ${name} -> ${used}`);
    }
  } catch (err) {
    console.error('Failed to read', full, err.message);
  }
}
