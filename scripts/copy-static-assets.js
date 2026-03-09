import { cp, mkdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const distDir = path.join(repoRoot, 'dist');
const staticDirs = ['Images', 'Sound'];

async function pathExists(targetPath) {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function copyStaticDir(dirName) {
  const sourceDir = path.join(repoRoot, dirName);
  const targetDir = path.join(distDir, dirName);

  if (!(await pathExists(sourceDir))) {
    throw new Error(`Static asset directory not found: ${dirName}`);
  }

  await rm(targetDir, { recursive: true, force: true });
  await cp(sourceDir, targetDir, { recursive: true });
}

async function main() {
  await mkdir(distDir, { recursive: true });
  await Promise.all(staticDirs.map(copyStaticDir));
  console.log(`Copied static assets into ${distDir}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
