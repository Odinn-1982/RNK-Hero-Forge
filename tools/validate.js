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
  process.exit(0);
} else {
  console.error('Validation failed');
  process.exit(2);
}
