import { readFileSync } from 'node:fs'

const ADD_HEADER = /^\s*add_header\s+([\w-]+)\s+"([^"]*)"/

/**
 * Parses the `add_header Name "value"` directives of an nginx snippet
 */
export function parseNginxHeaders(snippet: string): Record<string, string> {
  const headers: Record<string, string> = {}
  for (const line of snippet.split(/\r?\n/)) {
    const match = line.match(ADD_HEADER)
    if (match) headers[match[1]] = match[2]
  }
  return headers
}

/**
 * The security headers nginx sends in production, so `vite preview` enforces the same CSP
 */
export function readNginxSecurityHeaders(snippetPath: string): Record<string, string> {
  return parseNginxHeaders(readFileSync(snippetPath, 'utf8'))
}
