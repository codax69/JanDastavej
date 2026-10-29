import { spawn, spawnSync } from 'node:child_process';

console.log('[Dev] Ensuring @jandastavej/shared is built...');
const buildShared = spawnSync('npm', ['run', 'build', '--workspace=packages/shared'], {
  stdio: 'inherit',
  shell: true,
});

if (buildShared.status !== 0) {
  console.error('[Dev] Failed to build @jandastavej/shared. Aborting dev startup.');
  process.exit(1);
}

function run(name, cmd, args) {
  const proc = spawn(cmd, args, { stdio: 'inherit', shell: true });
  proc.on('close', (code) => {
    if (code !== 0) {
      console.error(`[${name}] process exited with code ${code}`);
    }
  });
  return proc;
}

const api = run('API', 'npm', ['run', 'dev', '--workspace=apps/api']);
const web = run('WEB', 'npm', ['run', 'dev', '--workspace=apps/web']);

function shutdown() {
  api.kill();
  web.kill();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
