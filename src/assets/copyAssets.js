import path from 'path';
import fs from 'fs-extra';
import { warn } from '../logger.js';

export async function copyWebAssets(inputDir, assetsWwwDir) {
  await fs.ensureDir(assetsWwwDir);
  await fs.copy(inputDir, assetsWwwDir);

  // Warn if service workers are used (won't work from file:// URLs)
  const jsFiles = await findJsFiles(assetsWwwDir);
  for (const f of jsFiles) {
    const content = await fs.readFile(f, 'utf8');
    if (content.includes('serviceWorker.register')) {
      warn(`Service Workers are not supported with file:// URLs. Found in: ${path.relative(assetsWwwDir, f)}`);
      break;
    }
  }
}

async function findJsFiles(dir) {
  const results = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...await findJsFiles(full));
    else if (entry.name.endsWith('.js')) results.push(full);
  }
  return results;
}
