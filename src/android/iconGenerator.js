import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MIPMAP_SIZES = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

const DEFAULT_ICON = path.join(__dirname, '../../templates/default-icon.png');

export async function generateIcons(cfg, resDir) {
  const sourcePath = cfg.icon || DEFAULT_ICON;

  for (const [density, size] of Object.entries(MIPMAP_SIZES)) {
    const destDir = path.join(resDir, density);
    await fs.ensureDir(destDir);
    await sharp(sourcePath)
      .resize(size, size)
      .png()
      .toFile(path.join(destDir, 'ic_launcher.png'));
  }
}
