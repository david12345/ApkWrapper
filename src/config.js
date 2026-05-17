import path from 'path';
import fs from 'fs-extra';
import { warn } from './logger.js';

export class ConfigError extends Error {
  constructor(msg) { super(msg); this.name = 'ConfigError'; }
}

const PACKAGE_RE = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){2,}$/;

const DEFAULTS = {
  package: 'com.example.app',
  versionName: '1.0.0',
  versionCode: 1,
  minSdk: 21,
  targetSdk: 35,
  output: './dist',
  allowHttp: false,
  useDocker: false,
  keepProject: false,
  verbose: false,
};

export function buildConfig(cliOpts, inputDir) {
  const cfg = { ...DEFAULTS, ...cliOpts, inputDir: path.resolve(inputDir) };

  if (!cfg.name) throw new ConfigError('--name is required');

  if (!PACKAGE_RE.test(cfg.package)) {
    throw new ConfigError(
      `Invalid package name "${cfg.package}". Must be like "com.example.myapp" (at least 3 dot-separated lowercase segments).`
    );
  }

  const vc = Number(cfg.versionCode);
  if (!Number.isInteger(vc) || vc < 1) {
    throw new ConfigError('--version-code must be a positive integer');
  }
  cfg.versionCode = vc;

  const minSdk = Number(cfg.minSdk);
  const targetSdk = Number(cfg.targetSdk);
  if (minSdk < 16) throw new ConfigError('--min-sdk must be >= 16');
  if (minSdk < 21) warn('min-sdk below 21 may cause WebView instability on older devices');
  if (targetSdk < minSdk) throw new ConfigError('--target-sdk must be >= --min-sdk');
  cfg.minSdk = minSdk;
  cfg.targetSdk = targetSdk;

  if (cfg.icon) {
    cfg.icon = path.resolve(cfg.icon);
    if (!fs.pathExistsSync(cfg.icon)) {
      throw new ConfigError(`Icon file not found: ${cfg.icon}`);
    }
  }

  cfg.output = path.resolve(cfg.output);

  // Derive safe identifiers from package name
  const parts = cfg.package.split('.');
  cfg.packageDir = parts.join('/');
  cfg.className = 'MainActivity';

  return cfg;
}
