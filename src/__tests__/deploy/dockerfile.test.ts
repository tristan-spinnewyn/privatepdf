// @vitest-environment node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const dockerfile = readFileSync(resolve(process.cwd(), 'Dockerfile'), 'utf8');
const nginxConfig = readFileSync(resolve(process.cwd(), 'nginx.conf'), 'utf8');
const composeFile = readFileSync(resolve(process.cwd(), 'docker-compose.yml'), 'utf8');
const packageJson = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')) as {
  packageManager?: string;
};

// Container port Coolify routes production traffic to ("Ports Exposes" setting)
const APP_PORT = 3000;

function baseImages(source: string): string[] {
  return [...source.matchAll(/^FROM\s+(\S+)/gm)].map((match) => match[1]);
}

function exposedPorts(source: string): number[] {
  return [...source.matchAll(/^EXPOSE\s+(.+)$/gm)].flatMap((match) =>
    match[1].trim().split(/\s+/).map(Number)
  );
}

function composeContainerPorts(source: string): number[] {
  return [...source.matchAll(/^\s*-\s*"?\d+:(\d+)"?\s*$/gm)].map((match) => Number(match[1]));
}

function listenedPorts(source: string): number[] {
  return [...source.matchAll(/^\s*listen\s+(\d+)\s*;/gm)].map((match) => Number(match[1]));
}

describe('Dockerfile', () => {
  it('pins every base image to an exact version', () => {
    const images = baseImages(dockerfile);
    expect(images.length).toBeGreaterThan(0);
    for (const image of images) {
      expect(image).toMatch(/:\d+\.\d+\.\d+-alpine\d+\.\d+(@sha256:[0-9a-f]{64})?$/);
    }
  });

  it('builds with Node 22', () => {
    expect(baseImages(dockerfile)[0]).toMatch(/^node:22\./);
  });

  it('serves the app with the unprivileged nginx image', () => {
    expect(baseImages(dockerfile).at(-1)).toMatch(/^nginxinc\/nginx-unprivileged:/);
    expect(dockerfile).not.toMatch(/^USER\s+(root|0)\b/m);
  });

  it('installs the pnpm version pinned in package.json through corepack', () => {
    expect(packageJson.packageManager).toMatch(/^pnpm@\d+\.\d+\.\d+$/);
    expect(dockerfile).toMatch(/RUN\s+corepack enable/);
    expect(dockerfile).not.toMatch(/npm install -g pnpm/);
  });

  it('declares a healthcheck that probes nginx over IPv4', () => {
    expect(dockerfile).toMatch(
      new RegExp(`^HEALTHCHECK\\b[\\s\\S]*http://127\\.0\\.0\\.1:${APP_PORT}/`, 'm')
    );
    expect(dockerfile).not.toMatch(/HEALTHCHECK[\s\S]*localhost/);
  });

  it('listens on and exposes only the Coolify application port', () => {
    expect(listenedPorts(nginxConfig)).toEqual([APP_PORT]);
    expect(exposedPorts(dockerfile)).toEqual([APP_PORT]);
  });

  it('publishes the application port in docker-compose', () => {
    expect(composeContainerPorts(composeFile)).toEqual([APP_PORT]);
  });
});
