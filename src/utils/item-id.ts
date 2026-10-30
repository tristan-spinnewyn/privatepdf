/**
 * Builds a unique id for a file added to a tool's list
 */
export function createItemId(file: File): string {
  return `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}
