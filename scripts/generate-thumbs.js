#!/usr/bin/env node
// Generate 128px thumbnails for equipment images.
// Skips images that already have an up-to-date _thumb variant.
// Usage: node scripts/generate-thumbs.js   (or: npm run thumbs)
//
// Requires: pip install Pillow  (uses Python/Pillow for Lanczos resize)

import { execSync } from 'child_process';
import { readdirSync, statSync, existsSync, writeFileSync, unlinkSync } from 'fs';
import { basename, extname } from 'path';

const SRC_DIR = 'Images/Equipment';
const SIZE = 128;

const files = readdirSync(SRC_DIR)
  .filter(f => f.endsWith('.png') && !f.includes('_thumb'));

// Collect files that need thumbnail generation
const toGenerate = [];

for (const file of files) {
  const stem = basename(file, extname(file));
  const srcPath = `${SRC_DIR}/${file}`;
  const thumbPath = `${SRC_DIR}/${stem}_thumb.png`;

  // Skip if thumb exists and is newer than source
  try {
    const srcMtime = statSync(srcPath).mtimeMs;
    const thumbMtime = statSync(thumbPath).mtimeMs;
    if (thumbMtime >= srcMtime) continue;
  } catch {
    // thumb doesn't exist yet
  }

  toGenerate.push({ file, stem, srcPath, thumbPath });
}

const skipped = files.length - toGenerate.length;

if (toGenerate.length === 0) {
  console.log(`Done. Generated: 0, Skipped (up-to-date): ${skipped}`);
  process.exit(0);
}

// Write a temp Python script to batch-generate all thumbs at once
const pyLines = ['from PIL import Image'];
for (const { srcPath, thumbPath } of toGenerate) {
  // Use forward slashes — Python handles them on all platforms
  pyLines.push(`img = Image.open('${srcPath}')`);
  pyLines.push(`img = img.resize((${SIZE}, ${SIZE}), Image.LANCZOS)`);
  pyLines.push(`img.save('${thumbPath}', 'PNG', optimize=True)`);
}

const tmpPy = 'scripts/_gen_thumbs_tmp.py';
writeFileSync(tmpPy, pyLines.join('\n') + '\n');

try {
  execSync(`python ${tmpPy}`, { stdio: 'inherit' });
} catch (err) {
  console.error('Python thumbnail generation failed.');
  process.exit(1);
} finally {
  try { unlinkSync(tmpPy); } catch { /* ignore */ }
}

let generated = 0;
for (const { file, stem, thumbPath } of toGenerate) {
  if (existsSync(thumbPath)) {
    console.log(`  ${file} -> ${stem}_thumb.png`);
    generated++;
  } else {
    console.error(`  FAILED: ${file} — thumb file not created`);
  }
}

console.log(`\nDone. Generated: ${generated}, Skipped (up-to-date): ${skipped}`);
