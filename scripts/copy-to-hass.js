import fs from 'fs';
import path from 'path';
import config from '../config.js';

const sourceDir = path.join(process.cwd(), 'target');
const destDir = path.join(config.hassConfigPath, 'www', 'hyper-light-card');

console.log(`Source directory: ${sourceDir}`);
console.log(`Destination directory: ${destDir}`);

// Ensure the destination directory exists
if (!fs.existsSync(destDir)) {
  console.log(`Creating directory: ${destDir}`);
  fs.mkdirSync(destDir, { recursive: true });
}

const filesToCopy = ['hyper-light-card.js', 'hyper-light-card.js.map'];

// Check if a CSS file exists and add it to the files to copy
const cssFile = 'hyper-light-card-styles.css';
if (fs.existsSync(path.join(sourceDir, cssFile))) {
  filesToCopy.push(cssFile);
  console.log(`CSS file found: ${cssFile}`);
} else {
  console.log(`CSS file not found: ${cssFile}`);
}

filesToCopy.forEach(file => {
  const sourcePath = path.join(sourceDir, file);
  const destPath = path.join(destDir, file);

  console.log(`Attempting to copy ${sourcePath} to ${destPath}`);

  if (fs.existsSync(sourcePath)) {
    fs.copyFile(sourcePath, destPath, err => {
      if (err) {
        console.error(`Error copying ${file}: ${err}`);
      } else {
        console.log(`Successfully copied ${file} to ${destPath}`);
        console.log(`File size: ${fs.statSync(destPath).size} bytes`);
      }
    });
  } else {
    console.error(`Source file does not exist: ${sourcePath}`);
  }
});

console.log('Copy process completed.');
