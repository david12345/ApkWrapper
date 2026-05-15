import path from 'path';
import fs from 'fs-extra';
import { execa } from 'execa';
import { findAndroidSdk, sdkNotFoundError, SdkError } from './findSdk.js';
import { buildWithHostSdk } from './hostBuild.js';
import { buildWithDocker } from './dockerBuild.js';

export { SdkError };

export async function build(projectDir, cfg) {
  const { androidSdk, useDocker, verbose } = cfg;

  if (!useDocker) {
    const sdkPath = await findAndroidSdk(androidSdk);
    if (sdkPath) {
      return buildWithHostSdk(projectDir, sdkPath, verbose);
    }
  }

  // Fall back to Docker
  const dockerAvailable = await isDockerAvailable();
  if (dockerAvailable) {
    return buildWithDocker(projectDir, verbose, cfg.dockerImage);
  }

  throw sdkNotFoundError();
}

async function isDockerAvailable() {
  try {
    await execa('docker', ['info'], { stdout: 'ignore', stderr: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export async function getSdkPath(cfg) {
  return findAndroidSdk(cfg.androidSdk);
}
