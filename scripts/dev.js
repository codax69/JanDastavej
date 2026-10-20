import { spawn } from 'node:child_process';

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
