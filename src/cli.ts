#!/usr/bin/env node

import compile from './';

if (process.argv.length < 4) {
  console.warn('Usage: ts-bicycle <input-directory> <ouptut-directory>');
  process.exit(1);
}

compile(process.argv[2], process.argv[3]).catch(ex => {
  console.error(ex.message || ex);
  process.exit(1);
});
