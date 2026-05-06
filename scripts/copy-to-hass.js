import fs from 'node:fs';
import path from 'node:path';
import config from '../config.js';

const sourceDir = path.join(process.cwd(), 'target');
const destDir = path.join(config.hassConfigPath, 'www', 'hyper-light-card');

console.log(`Source directory: ${sourceDir}`);
console.log(`Destination directory: ${destDir}`);

if (!fs.existsSync(destDir)) {
  console.log(`Creating directory: ${destDir}`);
  fs.mkdirSync(destDir, { recursive: true });
}

// Vite inlines the styles into hyper-light-card.js via the `?inline` CSS
// import, so there's no separate stylesheet to copy. The sourcemap only
// shows up on production builds; treat its absence as fine.
const filesToCopy = [
  { name: 'hyper-light-card.js', required: true },
  { name: 'hyper-light-card.js.map', required: false },
];

for (const { name, required } of filesToCopy) {
  const sourcePath = path.join(sourceDir, name);
  const destPath = path.join(destDir, name);

  if (!fs.existsSync(sourcePath)) {
    if (required) {
      console.error(`Source file does not exist: ${sourcePath}`);
      process.exitCode = 1;
    } else {
      console.log(`Skipping optional file (not built): ${name}`);
    }
    continue;
  }

  fs.copyFile(sourcePath, destPath, err => {
    if (err) {
      console.error(`Error copying ${name}: ${err}`);
      process.exitCode = 1;
      return;
    }
    console.log(`Copied ${name} (${fs.statSync(destPath).size} bytes)`);
  });
}
