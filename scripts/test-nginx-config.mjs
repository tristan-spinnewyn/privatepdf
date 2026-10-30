import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const SECURITY_HEADERS_INCLUDE = 'include /etc/nginx/snippets/security-headers.conf;';

const config = readFileSync(new URL('../nginx.conf', import.meta.url), 'utf8');
const dockerfile = readFileSync(new URL('../Dockerfile', import.meta.url), 'utf8');

// Returns { pattern, body } for every top-level `location` block (no nested blocks expected besides `types {}`)
function parseLocations(source) {
  const locations = [];
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

function findLocationFor(locations, path) {
  return locations.find(({ pattern }) => {
    const regex = pattern.match(/^~\*\s+(.+)$/);
    return regex && new RegExp(regex[1], 'i').test(path);
  });
}

function runTests() {
  console.log('--- Starting Nginx Configuration Verification ---');
  const locations = parseLocations(config);

  // 1. The pdf.js module worker must be served as JavaScript, otherwise browsers refuse to load it
  const workerLocation = findLocationFor(locations, '/pdf.worker.min.mjs');
  assert.ok(workerLocation, 'No location block matches .mjs files');
  assert.match(workerLocation.body, /types\s*\{\s*\}/, '.mjs location must reset inherited MIME types');
  assert.match(workerLocation.body, /default_type\s+application\/javascript;/, '.mjs must be served as application/javascript');
  console.log('✓ .mjs files are served as application/javascript');

  // 2. The worker URL is not content-hashed, so it must not be cached as immutable
  assert.doesNotMatch(workerLocation.body, /immutable/, 'Unhashed .mjs files must not be cached as immutable');
  console.log('✓ pdf.js worker is not cached as immutable');

  // 3. add_header in a location drops server-level headers, so every location must include the security headers
  for (const { pattern, body } of locations) {
    assert.ok(body.includes(SECURITY_HEADERS_INCLUDE), `Location "${pattern}" does not include the security headers`);
  }
  const serverLevelConfig = config.slice(0, config.indexOf('location'));
  assert.ok(serverLevelConfig.includes(SECURITY_HEADERS_INCLUDE), 'Server block does not include the security headers');
  console.log('✓ Security headers are applied in every location');

  // 4. The security headers snippet must be shipped in the image at the included path
  assert.match(dockerfile, /COPY\s+nginx\/security-headers\.conf\s+\/etc\/nginx\/snippets\/security-headers\.conf/);
  console.log('✓ Security headers snippet is copied into the image');

  console.log('\nNGINX CONFIGURATION VERIFIED SUCCESSFULLY!');
}

runTests();
