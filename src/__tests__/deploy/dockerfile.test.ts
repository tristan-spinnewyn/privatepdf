// @vitest-environment node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const dockerfile = readFileSync(resolve(process.cwd(), 'Dockerfile'), 'utf8');
const nginxConfig = readFileSync(resolve(process.cwd(), 'nginx.conf'), 'utf8');
const packageJson = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')) as {
  packageManager?: string;
};

// Port the unprivileged nginx image listens on by default; the healthcheck probes it
const HEALTHCHECK_PORT = 8080;

function baseImages(source: string): string[] {
  return [...source.matchAll(/^FROM\s+(\S+)/gm)].map((match) => match[1]);
}

function exposedPorts(source: string): number[] {
  return [...source.matchAll(/^EXPOSE\s+(.+)$/gm)].flatMap((match) =>
    match[1].trim().split(/\s+/).map(Number)
  );
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
      new RegExp(`^HEALTHCHECK\\b[\\s\\S]*http://127\\.0\\.0\\.1:${HEALTHCHECK_PORT}/`, 'm')
    );
    expect(dockerfile).not.toMatch(/HEALTHCHECK[\s\S]*localhost/);
  });

  it('only exposes ports nginx listens on, including the healthcheck port', () => {
    const listened = listenedPorts(nginxConfig);
    expect(listened).toContain(HEALTHCHECK_PORT);
    expect(exposedPorts(dockerfile)).toContain(HEALTHCHECK_PORT);
    for (const port of exposedPorts(dockerfile)) {
      expect(listened).toContain(port);
    }
  });
});
