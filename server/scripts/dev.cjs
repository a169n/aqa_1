const path = require('node:path');
const { spawn } = require('node:child_process');

const serverRoot = path.resolve(__dirname, '..');
const tsxCliPath = require.resolve('tsx/cli', {
  paths: [serverRoot],
});

const child = spawn(process.execPath, [tsxCliPath, 'watch', 'src/index.ts'], {
  cwd: serverRoot,
  env: process.env,
  stdio: ['inherit', 'pipe', 'pipe'],
});

let hasOpenedDocs = false;
const shouldOpenDocs = process.env.OPEN_API_DOCS !== 'false' && process.env.CI !== 'true';

const openUrl = (url) => {
  if (process.platform === 'win32') {
    spawn('cmd', ['/c', 'start', '', url], {
      detached: true,
      stdio: 'ignore',
    }).unref();
    return;
  }

  if (process.platform === 'darwin') {
    spawn('open', [url], {
      detached: true,
      stdio: 'ignore',
    }).unref();
    return;
  }

  spawn('xdg-open', [url], {
    detached: true,
    stdio: 'ignore',
  }).unref();
};

const forwardOutput = (stream, writer) => {
  stream.on('data', (chunk) => {
    const text = chunk.toString();
    writer.write(text);

    if (hasOpenedDocs || !shouldOpenDocs) {
      return;
    }

    const match = text.match(/API listening on (http:\/\/localhost:\d+)/);

    if (!match) {
      return;
    }

    hasOpenedDocs = true;
    openUrl(`${match[1]}/docs`);
  });
};

forwardOutput(child.stdout, process.stdout);
forwardOutput(child.stderr, process.stderr);

child.on('error', (error) => {
  console.error('Failed to start the server dev process.', error);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));
