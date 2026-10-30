// @vitest-environment node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SECURITY_HEADERS_INCLUDE = 'include /etc/nginx/snippets/security-headers.conf;';

const config = readFileSync(resolve(process.cwd(), 'nginx.conf'), 'utf8');
const dockerfile = readFileSync(resolve(process.cwd(), 'Dockerfile'), 'utf8');

interface LocationBlock {
  pattern: string;
  body: string;
}

// Returns every top-level `location` block (no nested blocks expected besides `types {}`)
function parseLocations(source: string): LocationBlock[] {
  const locations: LocationBlock[] = [];
  const locationStart = /location\s+([^{]+)\{/g;
  let match;
  while ((match = locationStart.exec(source)) !== null) {
    let depth = 1;
    let i = locationStart.lastIndex;
    while (depth > 0 && i < source.length) {
      if (source[i] === '{') depth++;
      if (source[i] === '}') depth--;
      i++;
    }
    locations.push({ pattern: match[1].trim(), body: source.slice(locationStart.lastIndex, i - 1) });
  }
  return locations;
}

// Mirrors nginx: the first matching regex location wins
function findLocationFor(locations: LocationBlock[], path: string): LocationBlock | undefined {
  return locations.find(({ pattern }) => {
    const regex = pattern.match(/^~\*\s+(.+)$/);
    return regex !== null && new RegExp(regex[1], 'i').test(path);
  });
}

describe('nginx configuration', () => {
  const locations = parseLocations(config);
  const workerLocation = findLocationFor(locations, '/pdf.worker.min.mjs');

  it('serves .mjs files as application/javascript so browsers load the pdf.js worker', () => {
    expect(workerLocation).toBeDefined();
    expect(workerLocation!.body).toMatch(/types\s*\{\s*\}/);
    expect(workerLocation!.body).toMatch(/default_type\s+application\/javascript;/);
  });

  it('does not cache the unhashed pdf.js worker as immutable', () => {
    expect(workerLocation!.body).not.toMatch(/immutable/);
  });

  it('applies the security headers at server level and in every location', () => {
    const serverLevelConfig = config.slice(0, config.indexOf('location'));
    expect(serverLevelConfig).toContain(SECURITY_HEADERS_INCLUDE);
    for (const { body } of locations) {
      expect(body).toContain(SECURITY_HEADERS_INCLUDE);
    }
  });

  it('ships the security headers snippet in the image', () => {
    expect(dockerfile).toMatch(
      /COPY\s+nginx\/security-headers\.conf\s+\/etc\/nginx\/snippets\/security-headers\.conf/
    );
  });
});
