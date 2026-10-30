import { formatPageRange, parsePageRange } from '../../utils/page-range';

describe('formatPageRange', () => {
  it('returns an empty string for no pages', () => {
    expect(formatPageRange(new Set())).toBe('');
  });

  it('collapses consecutive pages into ranges', () => {
    expect(formatPageRange(new Set([7, 1, 2, 3, 5]))).toBe('1-3, 5, 7');
  });
});

describe('parsePageRange', () => {
  it('parses single pages and ranges within bounds', () => {
    expect(parsePageRange('1, 3-5', 10)).toEqual(new Set([1, 3, 4, 5]));
  });

  it('clamps reversed and out-of-bounds ranges', () => {
    expect(parsePageRange('4-2, 8-20', 9)).toEqual(new Set([2, 3, 4, 8, 9]));
  });

  it('ignores invalid and out-of-bounds entries', () => {
    expect(parsePageRange('abc, 0, 12, , 2-x', 10)).toEqual(new Set());
  });
});
