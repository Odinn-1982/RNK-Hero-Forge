#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import process from 'process';

function usage() {
  console.log('Usage: node tools/prepare-release.js --owner <github-owner> --repo <repo> --version <vX.Y.Z> --name "Author Name" --email "email@example.com"');
}

const args = process.argv.slice(2);
const opts = {};
for (let i = 0; i < args.length; i += 1) {
  const a = args[i];
  if (a.startsWith('--')) {
    const key = a.slice(2);
    const value = args[i + 1];
    opts[key] = value;
    i += 1;
  }
}

if (!opts.owner || !opts.repo || !opts.version || !opts.name || !opts.email) {
  usage();
  process.exit(1);
}

const root = path.resolve();
const modulePath = path.join(root, 'module.json');
const manifestPath = path.join(root, 'manifest.json');

const moduleJson = JSON.parse(fs.readFileSync(modulePath, 'utf8'));
moduleJson.version = opts.version;
moduleJson.authors = [{ name: opts.name, email: opts.email, url: opts.url || `https://github.com/${opts.owner}` }];
moduleJson.manifest = `https://raw.githubusercontent.com/${opts.owner}/${opts.repo}/main/manifest.json`;
moduleJson.download = `https://github.com/${opts.owner}/${opts.repo}/releases/download/${opts.version}/${moduleJson.id}-${opts.version}.zip`;
moduleJson.url = `https://github.com/${opts.owner}/${opts.repo}`;
fs.writeFileSync(modulePath, JSON.stringify(moduleJson, null, 2) + '\n');

const manifestJson = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (manifestJson) {
  manifestJson.homepage = `https://github.com/${opts.owner}/${opts.repo}`;
  manifestJson.download = `https://github.com/${opts.owner}/${opts.repo}/releases/download/${opts.version}/${moduleJson.id}-${opts.version}.zip`;
  manifestJson.manifest = `https://raw.githubusercontent.com/${opts.owner}/${opts.repo}/main/manifest.json`;
  manifestJson.version = opts.version;
  fs.writeFileSync(manifestPath, JSON.stringify(manifestJson, null, 2) + '\n');
}

console.log('Prepared module.json and manifest.json for release', opts);
