import path from 'path';
import os from 'os';
import fs from 'fs-extra';
import { Command } from 'commander';
import chalk from 'chalk';
import { buildConfig, ConfigError } from './config.js';
import { validateInputDir, InputError } from './input/validateDir.js';
import { generateAndroidProject } from './android/projectGenerator.js';
import { ensureDebugKeystore, SigningError } from './signing/keystore.js';
import { build, SdkError } from './build/index.js';
import { BuildError } from './build/hostBuild.js';
import { startSpinner, succeedSpinner, failSpinner, info, success, error as logError } from './logger.js';

export async function run(argv) {
  const program = new Command();

  program
    .name('apkwrapper')
    .description('Convert HTML/JS web apps into Android APK files')
    .version('1.0.0');

  program
    .command('build <input-dir>')
    .description('Build an Android APK from an HTML/JS directory')
    .requiredOption('--name <name>', 'App display name')
    .option('--package <id>', 'Android package ID', 'com.example.app')
    .option('--version-name <ver>', 'Version string', '1.0.0')
    .option('--version-code <int>', 'Version code integer', '1')
    .option('--min-sdk <int>', 'Minimum Android API level', '21')
    .option('--target-sdk <int>', 'Target Android API level', '34')
    .option('--icon <path>', 'Path to PNG icon (512x512 recommended)')
    .option('--output <path>', 'Output directory for APK', './dist')
    .option('--allow-http', 'Allow cleartext HTTP traffic', false)
    .option('--android-sdk <path>', 'Android SDK path (overrides $ANDROID_HOME)')
    .option('--use-docker', 'Force Docker build even if SDK is available', false)
    .option('--keep-project', 'Keep generated Android project after build', false)
    .option('--verbose', 'Show verbose Gradle output', false)
    .action(async (inputDir, opts) => {
      await runBuild(inputDir, opts);
    });

  await program.parseAsync(argv);
}

async function runBuild(inputDir, opts) {
  let projectDir = null;
  const keepProject = opts.keepProject;

  try {
    // Build and validate config
    const cfg = buildConfig(opts, inputDir);

    // Validate input directory
    startSpinner('Validating input...');
    await validateInputDir(cfg.inputDir);
    succeedSpinner('Input validated');

    // Create temp project directory
    projectDir = path.join(os.tmpdir(), `apkwrapper-${Date.now()}`);
    await fs.ensureDir(projectDir);

    // Ensure debug keystore
    startSpinner('Setting up signing keystore...');
    const keystorePath = await ensureDebugKeystore();
    succeedSpinner('Keystore ready');

    // Find Android SDK (for local.properties)
    const { findAndroidSdk } = await import('./build/findSdk.js');
    const sdkPath = await findAndroidSdk(cfg.androidSdk) || '';

    // Generate Android project
    startSpinner('Generating Android project...');
    await generateAndroidProject(cfg, projectDir, keystorePath, sdkPath);
    succeedSpinner('Android project generated');

    if (cfg.keepProject) {
      info(`Android project at: ${projectDir}`);
    }

    // Build APK
    startSpinner('Building APK (this may take a few minutes on first run)...');
    const apkPath = await build(projectDir, cfg);
    succeedSpinner('APK built successfully');

    // Copy APK to output
    await fs.ensureDir(cfg.output);
    const safeName = cfg.name.replace(/[^a-zA-Z0-9_-]/g, '-');
    const destApk = path.join(cfg.output, `${safeName}-v${cfg.versionName}.apk`);
    await fs.copy(apkPath, destApk);

    const size = (await fs.stat(destApk)).size;
    const sizeMb = (size / 1024 / 1024).toFixed(2);

    success(`\nAPK ready: ${chalk.bold(destApk)} (${sizeMb} MB)`);
    info(`Install with: adb install "${destApk}"`);

  } catch (err) {
    failSpinner('Failed');

    if (err instanceof ConfigError || err instanceof InputError) {
      logError(err.message);
    } else if (err instanceof SdkError) {
      logError(err.message);
    } else if (err instanceof SigningError) {
      logError(err.message);
    } else if (err instanceof BuildError) {
      logError(err.message);
      if (err.gradleOutput && opts.verbose) {
        console.error('\n' + chalk.dim(err.gradleOutput));
      }
    } else {
      logError(`Unexpected error: ${err.message}`);
      if (opts.verbose) console.error(err.stack);
    }

    process.exit(1);
  } finally {
    if (projectDir && !keepProject) {
      await fs.remove(projectDir).catch(() => {});
    }
  }
}
