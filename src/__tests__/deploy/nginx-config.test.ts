// @vitest-environment node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SECURITY_HEADERS_INCLUDE = 'include /etc/nginx/snippets/security-headers.conf;';

const config = readFileSync(resolve(process.cwd(), 'nginx.conf'), 'utf8');
const dockerfile = readFileSync(resolve(process.cwd(), 'Dockerfile'), 'utf8');
const securityHeaders = readFileSync(resolve(process.cwd(), 'nginx/security-headers.conf'), 'utf8');

// Parses the Content-Security-Policy header of the shared snippet into directive -> sources
function parseContentSecurityPolicy(snippet: string): Map<string, string[]> | undefined {
  const header = snippet.match(/add_header\s+Content-Security-Policy\s+"([^"]+)"\s+always;/);
  if (!header) return undefined;
  return new Map(
    header[1]
      .split(';')
      .map((directive) => directive.trim().split(/\s+/))
      .filter(([name]) => name)
      .map(([name, ...sources]) => [name, sources])
  );
}

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

  it('revalidates the unhashed pdf.js data files instead of caching them as immutable', () => {
    const pdfjsAssetsLocation = locations.find(({ pattern }) => pattern === '^~ /pdfjs/');
    expect(pdfjsAssetsLocation).toBeDefined();
    expect(pdfjsAssetsLocation!.body).toMatch(/add_header\s+Cache-Control\s+"no-cache";/);
    expect(pdfjsAssetsLocation!.body).not.toMatch(/immutable/);
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

  describe('Content-Security-Policy', () => {
    const csp = parseContentSecurityPolicy(securityHeaders);

    it('is sent with every response through the shared snippet', () => {
      expect(csp).toBeDefined();
    });

    it('only allows this origin by default', () => {
      expect(csp!.get('default-src')).toEqual(["'self'"]);
    });

    it('never allows external origins or inline scripts', () => {
      const allSources = [...csp!.values()].flat();
      expect(allSources.filter((source) => /^(https?:|\*|[\w-]+\.[\w.-]+)/.test(source))).toEqual([]);
      expect(csp!.get('script-src')).not.toContain("'unsafe-inline'");
    });

    it('lets pdf.js run its wasm decoders and module worker, and heic2any its eval-based worker', () => {
      expect(csp!.get('script-src')).toEqual(["'self'", "'wasm-unsafe-eval'", "'unsafe-eval'"]);
      expect(csp!.get('worker-src')).toEqual(["'self'", 'blob:']);
    });

    it('allows blob: and data: URLs for rendered pages, images and downloads', () => {
      expect(csp!.get('img-src')).toEqual(["'self'", 'blob:', 'data:']);
      expect(csp!.get('connect-src')).toEqual(["'self'", 'blob:', 'data:']);
    });

    it('locks down plugins, base URL, form targets and framing', () => {
      expect(csp!.get('object-src')).toEqual(["'none'"]);
      expect(csp!.get('base-uri')).toEqual(["'self'"]);
      expect(csp!.get('form-action')).toEqual(["'self'"]);
      expect(csp!.get('frame-ancestors')).toEqual(["'self'"]);
    });
  });
});
