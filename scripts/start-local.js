const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function quoteArg(value) {
  const raw = String(value);
  if (/^[A-Za-z0-9_./:=@-]+$/.test(raw)) {
    return raw;
  }
  return `"${raw.replace(/"/g, '\\"')}"`;
}

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  return fs.readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .reduce((env, line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        return env;
      }
      const separator = trimmed.indexOf('=');
      if (separator === -1) {
        return env;
      }
      const key = trimmed.slice(0, separator).trim();
      const value = trimmed.slice(separator + 1).trim().replace(/^"|"$/g, '');
      env[key] = value;
      return env;
    }, {});
}

function requestOk(url) {
  return new Promise((resolve) => {
    const request = http.get(url, (response) => {
      response.resume();
      resolve(response.statusCode >= 200 && response.statusCode < 400);
    });

    request.setTimeout(2000, () => {
      request.destroy();
      resolve(false);
    });

    request.on('error', () => resolve(false));
  });
}

function run(name, cwd, args, extraEnv) {
  console.log(`[local] starting ${name}: npm ${args.join(' ')}`);
  const child = spawn(`${npmCommand} ${args.map(quoteArg).join(' ')}`, {
    cwd,
    env: Object.assign({}, process.env, extraEnv || {}),
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  child.stdout.on('data', (chunk) => process.stdout.write(chunk));
  child.stderr.on('data', (chunk) => process.stderr.write(chunk));

  child.on('exit', (code, signal) => {
    if (signal) {
      console.log(`[local] ${name} stopped by ${signal}`);
      return;
    }
    if (code !== 0) {
      console.error(`[local] ${name} exited with code ${code}`);
    }
  });

  return child;
}

async function main() {
  const rootEnv = readEnvFile(path.join(rootDir, '.env.local'));
  const backendEnv = readEnvFile(path.join(rootDir, 'backend-node', '.env.local'));
  const backendPort = Number(backendEnv.PORT || rootEnv.BACKEND_PORT || 8206);
  const frontendPort = Number(process.env.FRONTEND_PORT || 8080);
  const backendHealthUrl = `http://127.0.0.1:${backendPort}/healthz`;
  const frontendUrl = `http://localhost:${frontendPort}/`;
  const children = [];

  if (await requestOk(backendHealthUrl)) {
    console.log(`[local] backend already running: ${backendHealthUrl}`);
  } else {
    children.push(run('backend', path.join(rootDir, 'backend-node'), ['run', 'start:local']));
  }

  if (await requestOk(frontendUrl)) {
    console.log(`[local] frontend already running: ${frontendUrl}`);
  } else {
    children.push(run('frontend', path.join(rootDir, 'frontend-vue'), ['run', 'serve:local', '--', '--port', String(frontendPort)], {
      VUE_APP_API_BASE_URL: rootEnv.VUE_APP_API_BASE_URL || `http://127.0.0.1:${backendPort}`,
      VUE_APP_SOCKET_URL: rootEnv.VUE_APP_SOCKET_URL || `http://127.0.0.1:${backendPort}`
    }));
  }

  console.log(`[local] open ${frontendUrl}`);

  if (children.length === 0) {
    return;
  }

  const shutdown = () => {
    for (const child of children) {
      if (!child.killed) {
        child.kill('SIGINT');
      }
    }
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
