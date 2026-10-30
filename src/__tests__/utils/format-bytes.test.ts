import { formatBytes } from '../../utils/format-bytes';

describe('formatBytes', () => {
  it('formats zero', () => {
    expect(formatBytes(0)).toBe('0 o');
  });

  it('formats bytes, kilobytes and megabytes', () => {
    expect(formatBytes(512)).toBe('512 o');
    expect(formatBytes(1536)).toBe('1.5 Ko');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5 Mo');
  });
});
