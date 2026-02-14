#!/usr/bin/env node
// Generate 128px thumbnails for equipment images.
// Skips images that already have an up-to-date _thumb variant.
// Usage: node scripts/generate-thumbs.js   (or: npm run thumbs)
//
// Requires: pip install Pillow  (uses Python/Pillow for Lanczos resize)

import { execSync } from 'child_process';
import { readdirSync, statSync } from 'fs';
import { join, basename, extname } from 'path';

const SRC_DIR = 'Images/Equipment';
const SIZE = 128;

const files = readdirSync(SRC_DIR)
  .filter(f => f.endsWith('.png') && !f.includes('_thumb'));

let generated = 0;
let skipped = 0;

for (const file of files) {
  const stem = basename(file, extname(file));
  const srcPath = join(SRC_DIR, file);
  const thumbPath = join(SRC_DIR, `${stem}_thumb.png`);

  // Skip if thumb exists and is newer than source
  try {
    const srcMtime = statSync(srcPath).mtimeMs;
    const thumbMtime = statSync(thumbPath).mtimeMs;
    if (thumbMtime >= srcMtime) {
      skipped++;
      continue;
    }
  } catch {
    // thumb doesn't exist yet — generate it
  }

  execSync(`python -c "
from PIL import Image
img = Image.open(r'${srcPath}')
img = img.resize((${SIZE}, ${SIZE}), Image.LANCZOS)
img.save(r'${thumbPath}', 'PNG', optimize=True)
"`);
  console.log(`  ${file} -> ${stem}_thumb.png`);
  generated++;
}

console.log(`\nDone. Generated: ${generated}, Skipped (up-to-date): ${skipped}`);
