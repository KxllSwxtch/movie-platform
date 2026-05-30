import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const prismaTmp = resolve(root, 'tmp', 'prisma');

mkdirSync(prismaTmp, { recursive: true });

const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const result = spawnSync(
  command,
  ['prisma', 'generate', '--schema=prisma/schema.prisma'],
  {
    cwd: resolve(root, 'apps', 'api'),
    env: {
      ...process.env,
      TMP: prismaTmp,
      TEMP: prismaTmp,
      TMPDIR: prismaTmp,
    },
    stdio: 'inherit',
    shell: process.platform === 'win32',
  },
);

if (result.error) {
  console.error(result.error.message);
}

process.exit(result.status ?? 1);
