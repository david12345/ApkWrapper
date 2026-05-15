import path from 'path';
import fs from 'fs-extra';

export class InputError extends Error {
  constructor(msg) { super(msg); this.name = 'InputError'; }
}

export async function validateInputDir(inputDir) {
  const stat = await fs.stat(inputDir).catch(() => null);
  if (!stat) throw new InputError(`Input directory not found: ${inputDir}`);
  if (!stat.isDirectory()) throw new InputError(`Input path is not a directory: ${inputDir}`);

  const indexHtml = path.join(inputDir, 'index.html');
  if (!await fs.pathExists(indexHtml)) {
    throw new InputError(`No index.html found in ${inputDir}. The web app must have an index.html at its root.`);
  }

  return inputDir;
}
