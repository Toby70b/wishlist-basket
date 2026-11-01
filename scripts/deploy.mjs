// `npm run deploy`: tests, builds the Lambda and the website, then runs terraform apply, which uploads both.
// Written in Node rather than a shell script so it runs the same on Windows, macOS and Linux CI.
// Stops at the first failing step.
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const LAMBDA_DIR = 'steam-wishlist-api-proxy-lambda';
const isWindows = process.platform === 'win32';

// The Lambda's own virtualenv, so the build never depends on which `python` is on PATH.
// Absolute, because the pytest step runs from inside LAMBDA_DIR.
const python = resolve(LAMBDA_DIR, isWindows ? '.venv/Scripts/python.exe' : '.venv/bin/python');

function run(command, args, options = {}) {
  console.log(`\n> ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, { stdio: 'inherit', ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

// Re-runs npm with the same npm that started this script (npm is a .cmd file on Windows, which can't be spawned directly)
const npm = (...args) => run(process.execPath, [process.env.npm_execpath, ...args]);

if (!process.env.npm_execpath) {
  console.error('Run this with `npm run deploy`.');
  process.exit(1);
}

if (!existsSync(python)) {
  console.error(`No Python virtualenv at ${python}. Create it first:\n` +
    `  cd ${LAMBDA_DIR} && python -m venv .venv && .venv/${isWindows ? 'Scripts' : 'bin'}/python -m pip install -r requirements-dev.txt`);
  process.exit(1);
}

npm('test');
run(python, ['-m', 'pytest', '-q'], { cwd: LAMBDA_DIR });
run(python, [`${LAMBDA_DIR}/build.py`]);
npm('run', 'build');
run('terraform', ['-chdir=terraform', 'apply']);
