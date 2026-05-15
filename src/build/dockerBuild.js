import path from 'path';
import os from 'os';
import { execa } from 'execa';
import { BuildError } from './hostBuild.js';

const DOCKER_IMAGE = 'mingc/android-build-box:latest';
const GRADLE_CACHE = path.join(os.homedir(), '.apkwrapper', 'gradle-cache');

function toDockerPath(p) {
  if (process.platform !== 'win32') return p;
  // Convert C:\Users\foo → /c/Users/foo for Docker Desktop on Windows
  return p.replace(/\\/g, '/').replace(/^([A-Za-z]):/, (_, d) => `/${d.toLowerCase()}`);
}

export async function buildWithDocker(projectDir, verbose, customImage) {
  const image = customImage || DOCKER_IMAGE;

  const dockerArgs = [
    'run', '--rm',
    '-v', `${toDockerPath(projectDir)}:/project`,
    '-v', `${toDockerPath(GRADLE_CACHE)}:/root/.gradle`,
    '-w', '/project',
    image,
    '/bin/bash', '-c',
    'chmod +x gradlew && ./gradlew assembleRelease --no-daemon',
  ];

  try {
    await execa('docker', dockerArgs, {
      stdout: verbose ? 'inherit' : 'pipe',
      stderr: verbose ? 'inherit' : 'pipe',
    });
  } catch (err) {
    const output = [err.stdout, err.stderr].filter(Boolean).join('\n');
    throw new BuildError(
      'Docker Gradle build failed. Run with --verbose for full output.',
      output
    );
  }

  return path.join(projectDir, 'app/build/outputs/apk/release/app-release.apk');
}
