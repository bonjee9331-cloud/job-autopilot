import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = new URL('..', import.meta.url).pathname;
const files = [];
const exts = new Set(['.js', '.mjs']);
const skip = new Set(['node_modules', '.git', '.next']);

function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (skip.has(name)) continue;
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full);
    else if ([...exts].some(ext => full.endsWith(ext))) files.push(full);
  }
}

walk(root);
for (const file of files) {
  execFileSync('node', ['--check', file], { stdio: 'inherit' });
}
console.log(`Checked ${files.length} JavaScript files successfully.`);
