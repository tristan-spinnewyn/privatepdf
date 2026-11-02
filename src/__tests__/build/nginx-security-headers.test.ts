// @vitest-environment node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseNginxHeaders, readNginxSecurityHeaders } from '../../../vite-plugins/nginx-security-headers';

describe('parseNginxHeaders', () => {
  it('reads every add_header directive and ignores comments', () => {
    const snippet = [
      '# add_header Ignored "yes" always;',
      'add_header X-Frame-Options "SAMEORIGIN" always;',
      "add_header Content-Security-Policy \"default-src 'self'; object-src 'none'\" always;",
    ].join('\n');

    expect(parseNginxHeaders(snippet)).toEqual({
      'X-Frame-Options': 'SAMEORIGIN',
      'Content-Security-Policy': "default-src 'self'; object-src 'none'",
    });
  });
});

describe('readNginxSecurityHeaders', () => {
  it('serves the production CSP from vite preview, so end-to-end tests run under it', () => {
    const headers = readNginxSecurityHeaders(resolve(process.cwd(), 'nginx/security-headers.conf'));
    const snippet = readFileSync(resolve(process.cwd(), 'nginx/security-headers.conf'), 'utf8');

    expect(headers['Content-Security-Policy']).toMatch(/^default-src 'self';/);
    expect(Object.keys(headers)).toHaveLength(snippet.match(/^add_header /gm)!.length);
  });
});
