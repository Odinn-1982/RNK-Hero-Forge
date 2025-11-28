#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

const root = path.resolve(process.cwd());
const outDir = path.join(root, 'dist');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const moduleJson = JSON.parse(fs.readFileSync(path.join(root, 'module.json'), 'utf8'));
const version = moduleJson.version || pkg.version || '0.0.0';
const name = moduleJson.id || pkg.name || 'rnk-hero-forge';
const outFile = path.join(outDir, `${name}-${version}.zip`);

// Files to include
const include = [
  'module.json',
  'manifest.json',
  'package.json',
  'README.md',
  'LICENSE',
  'templates',
  'styles',
  'src',
  'assets',
  'macros',
  'docs',
  'scripts',
  'lang'
];

(async function run() {
  if (fs.existsSync(outFile)) fs.unlinkSync(outFile);
  const output = fs.createWriteStream(outFile);
  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.pipe(output);

  for (const entry of include) {
    const p = path.join(root, entry);
    if (!fs.existsSync(p)) {
      console.warn(`Skipping missing entry: ${entry}`);
      continue;
    }
    const stats = fs.statSync(p);
    if (stats.isDirectory()) {
      archive.directory(p, entry);
    } else {
      archive.file(p, { name: entry });
    }
  }

  try {
    await archive.finalize();
    console.log(`Packaged module to ${outFile}`);
  } catch (err) {
    console.error('Failed to create archive', err);
    process.exitCode = 1;
  }
})();
