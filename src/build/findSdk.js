import path from 'path';
import fs from 'fs-extra';

export class SdkError extends Error {
  constructor(msg) { super(msg); this.name = 'SdkError'; }
}

export async function findAndroidSdk(overridePath) {
  const candidates = [
    overridePath,
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (await isValidSdk(candidate)) return candidate;
  }

  return null;
}

async function isValidSdk(sdkPath) {
  if (!sdkPath) return false;
  const buildToolsDir = path.join(sdkPath, 'build-tools');
  return fs.pathExists(buildToolsDir);
}

export function sdkNotFoundError() {
  return new SdkError(
    `Android SDK not found. Please do one of the following:
  1. Set the ANDROID_HOME environment variable to your Android SDK path
  2. Pass --android-sdk <path> to specify the SDK location
  3. Pass --use-docker to build using Docker (requires Docker to be installed)

  To install Android SDK:
  - Download Android Studio from https://developer.android.com/studio
  - Or install command-line tools from https://developer.android.com/studio#command-tools`
  );
}
