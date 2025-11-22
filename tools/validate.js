import fs from 'fs';
import path from 'path';

const root = path.resolve();
const required = [
  'module.json',
  'src/module.js',
  'templates/hub.hbs',
  'templates/button.hbs',
  'templates/hero-spend-chat.hbs'
];

let ok = true;
for (const r of required) {
  const p = path.join(root, r);
  if (!fs.existsSync(p)) {
    console.error('Missing file:', r);
    ok = false;
  }
}

if (ok) {
  console.log('Basic validation passed: required files exist');
  // Additional checks
  try {
    const moduleJson = JSON.parse(fs.readFileSync(path.join(root, 'module.json'), 'utf8'));
    const errors = [];
    if (moduleJson.manifest && moduleJson.manifest.includes('<github-username>')) errors.push('module.json.manifest contains <github-username> placeholder');
    if (moduleJson.download && moduleJson.download.includes('<github-username>')) errors.push('module.json.download contains <github-username> placeholder');
    if (moduleJson.authors && Array.isArray(moduleJson.authors)) {
      for (const a of moduleJson.authors) {
        if (a?.name === 'Your Name' || a?.email === 'you@example.com') errors.push('module.json.authors contains placeholder name/email');
      }
    }
    const manifestJson = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
    if (manifestJson.download && manifestJson.download.includes('<github-username>')) errors.push('manifest.json download contains <github-username> placeholder');
    if (manifestJson.manifest && manifestJson.manifest.includes('<github-username>')) errors.push('manifest.json manifest contains <github-username> placeholder');
    if (errors.length) {
      console.error('Validation warnings:');
      for (const e of errors) console.error('  -', e);
      process.exit(3);
    }
  } catch (err) {
    console.warn('Validation could not run advanced checks:', err.message || err);
  }
  process.exit(0);
} else {
  console.error('Validation failed');
  process.exit(2);
}
