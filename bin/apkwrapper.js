#!/usr/bin/env node
import('../src/cli.js').then(m => m.run(process.argv)).catch(err => {
  process.stderr.write((err.message || String(err)) + '\n');
  process.exit(1);
});
