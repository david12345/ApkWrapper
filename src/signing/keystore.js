import path from 'path';
import os from 'os';
import fs from 'fs-extra';
import { execa } from 'execa';

export class SigningError extends Error {
  constructor(msg) { super(msg); this.name = 'SigningError'; }
}

const KEYSTORE_DIR = path.join(os.homedir(), '.apkwrapper');
const KEYSTORE_PATH = path.join(KEYSTORE_DIR, 'debug.keystore');

export async function ensureDebugKeystore() {
  if (await fs.pathExists(KEYSTORE_PATH)) return KEYSTORE_PATH;

  await fs.ensureDir(KEYSTORE_DIR);

  try {
    await execa('keytool', [
      '-genkeypair', '-v',
      '-keystore', KEYSTORE_PATH,
      '-storepass', 'android',
      '-alias', 'androiddebugkey',
      '-keypass', 'android',
      '-keyalg', 'RSA',
      '-keysize', '2048',
      '-validity', '10000',
      '-dname', 'CN=Android Debug,O=Android,C=US',
    ]);
  } catch (err) {
    throw new SigningError(
      `Failed to generate debug keystore. Is Java (keytool) installed?\n${err.message}`
    );
  }

  return KEYSTORE_PATH;
}
