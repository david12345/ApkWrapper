import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import { generateManifest, generateNetworkSecurityConfig } from './manifest.js';
import {
  generateRootBuildGradle,
  generateSettingsGradle,
  generateGradleProperties,
  generateLocalProperties,
  generateAppBuildGradle,
  generateGradleWrapperProperties,
  generateProguardRules,
} from './gradleFiles.js';
import { generateMainActivity } from './sourceFiles.js';
import { generateActivityMain } from './layoutFiles.js';
import { generateStringsXml, generateThemesXml } from './resourceFiles.js';
import { generateIcons } from './iconGenerator.js';
import { copyWebAssets } from '../assets/copyAssets.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.join(__dirname, '../../templates');

export async function generateAndroidProject(cfg, projectDir, keystorePath, androidHome) {
  const appSrcMain = path.join(projectDir, 'app/src/main');
  const kotlinDir = path.join(appSrcMain, 'kotlin', cfg.packageDir);
  const resDir = path.join(appSrcMain, 'res');

  // Create all directories
  await Promise.all([
    fs.ensureDir(kotlinDir),
    fs.ensureDir(path.join(appSrcMain, 'assets/www')),
    fs.ensureDir(path.join(resDir, 'layout')),
    fs.ensureDir(path.join(resDir, 'values')),
    fs.ensureDir(path.join(resDir, 'xml')),
    fs.ensureDir(path.join(projectDir, 'gradle/wrapper')),
  ]);

  // Write all text files in parallel
  await Promise.all([
    // Root project files
    fs.outputFile(path.join(projectDir, 'build.gradle'), generateRootBuildGradle()),
    fs.outputFile(path.join(projectDir, 'settings.gradle'), generateSettingsGradle(cfg)),
    fs.outputFile(path.join(projectDir, 'gradle.properties'), generateGradleProperties()),
    fs.outputFile(path.join(projectDir, 'local.properties'), generateLocalProperties(androidHome || '')),

    // App module
    fs.outputFile(path.join(projectDir, 'app/build.gradle'), generateAppBuildGradle(cfg, keystorePath)),
    fs.outputFile(path.join(projectDir, 'app/proguard-rules.pro'), generateProguardRules()),

    // Android manifest
    fs.outputFile(path.join(appSrcMain, 'AndroidManifest.xml'), generateManifest(cfg)),

    // Kotlin source
    fs.outputFile(path.join(kotlinDir, 'MainActivity.kt'), generateMainActivity(cfg)),

    // Resources
    fs.outputFile(path.join(resDir, 'layout/activity_main.xml'), generateActivityMain()),
    fs.outputFile(path.join(resDir, 'values/strings.xml'), generateStringsXml(cfg)),
    fs.outputFile(path.join(resDir, 'values/themes.xml'), generateThemesXml()),
    fs.outputFile(path.join(resDir, 'xml/network_security_config.xml'), generateNetworkSecurityConfig(cfg.allowHttp)),

    // Gradle wrapper properties
    fs.outputFile(
      path.join(projectDir, 'gradle/wrapper/gradle-wrapper.properties'),
      generateGradleWrapperProperties()
    ),
  ]);

  // Copy gradle wrapper scripts and jar from templates
  await Promise.all([
    fs.copy(
      path.join(TEMPLATES_DIR, 'gradle/wrapper/gradle-wrapper.jar'),
      path.join(projectDir, 'gradle/wrapper/gradle-wrapper.jar')
    ),
    fs.copy(
      path.join(TEMPLATES_DIR, 'gradlew'),
      path.join(projectDir, 'gradlew')
    ),
    fs.copy(
      path.join(TEMPLATES_DIR, 'gradlew.bat'),
      path.join(projectDir, 'gradlew.bat')
    ),
  ]);

  // Make gradlew executable
  await fs.chmod(path.join(projectDir, 'gradlew'), 0o755);

  // Generate icons
  await generateIcons(cfg, resDir);

  // Copy web assets
  await copyWebAssets(cfg.inputDir, path.join(appSrcMain, 'assets/www'));
}
