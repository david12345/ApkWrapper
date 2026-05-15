import path from 'path';
import { execa } from 'execa';

export class BuildError extends Error {
  constructor(msg, gradleOutput) {
    super(msg);
    this.name = 'BuildError';
    this.gradleOutput = gradleOutput || '';
  }
}

export async function buildWithHostSdk(projectDir, androidHome, verbose) {
  const gradlew = path.join(projectDir, process.platform === 'win32' ? 'gradlew.bat' : 'gradlew');

  const gradleArgs = ['assembleRelease', '--no-daemon', '--stacktrace'];
  const env = {
    ...process.env,
    ANDROID_HOME: androidHome,
    ANDROID_SDK_ROOT: androidHome,
  };

  try {
    await execa(gradlew, gradleArgs, {
      cwd: projectDir,
      env,
      stdout: verbose ? 'inherit' : 'pipe',
      stderr: verbose ? 'inherit' : 'pipe',
    });
  } catch (err) {
    const output = [err.stdout, err.stderr].filter(Boolean).join('\n');
    const tip = diagnoseGradleError(output);
    throw new BuildError(
      `Gradle build failed.${tip ? '\n\nTip: ' + tip : ''}\n\nRun with --verbose for full output.`,
      output
    );
  }

  return path.join(projectDir, 'app/build/outputs/apk/release/app-release.apk');
}

function diagnoseGradleError(output) {
  if (output.includes('SDK location not found')) {
    return 'Android SDK location is not set. Check your ANDROID_HOME environment variable.';
  }
  if (output.includes('Could not resolve')) {
    return 'Failed to download dependencies. Check your internet connection.';
  }
  if (output.includes('Minimum supported Gradle version')) {
    return 'Gradle version mismatch. The gradle wrapper should handle this automatically.';
  }
  if (output.includes('license')) {
    return 'Android SDK licenses may not be accepted. Run: yes | sdkmanager --licenses';
  }
  return null;
}
