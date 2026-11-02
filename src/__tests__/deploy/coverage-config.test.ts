// @vitest-environment node
import config from '../../../vitest.config';

describe('coverage thresholds', () => {
  it('requires at least 80% on lines, statements, functions and branches', () => {
    const thresholds = config.test?.coverage && 'thresholds' in config.test.coverage
      ? config.test.coverage.thresholds
      : undefined;
    for (const metric of ['lines', 'statements', 'functions', 'branches'] as const) {
      expect(thresholds?.[metric]).toBeGreaterThanOrEqual(80);
    }
  });
});
