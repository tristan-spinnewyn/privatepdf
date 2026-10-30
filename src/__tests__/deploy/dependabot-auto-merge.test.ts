// @vitest-environment node
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const workflowPath = resolve(process.cwd(), '.github/workflows/dependabot-auto-merge.yml');
const workflow = () => readFileSync(workflowPath, 'utf8');

describe('Dependabot auto-merge workflow', () => {
  it('exists', () => {
    expect(existsSync(workflowPath)).toBe(true);
  });

  it('only acts on pull requests opened by Dependabot', () => {
    expect(workflow()).toMatch(/on:\s*\n\s*pull_request:/);
    expect(workflow()).toMatch(/github\.event\.pull_request\.user\.login == 'dependabot\[bot\]'/);
  });

  it('only auto-merges patch and minor updates, never majors', () => {
    expect(workflow()).toMatch(/version-update:semver-patch/);
    expect(workflow()).toMatch(/version-update:semver-minor/);
    expect(workflow()).not.toMatch(/version-update:semver-major/);
  });

  it('enables auto-merge so GitHub waits for the required CI checks before squashing', () => {
    expect(workflow()).toMatch(/gh pr merge --auto --squash/);
  });

  it('grants only the permissions it needs and pins actions to a commit SHA', () => {
    expect(workflow()).toMatch(/permissions:\s*\n\s*contents: write\s*\n\s*pull-requests: write/);
    const uses = [...workflow().matchAll(/uses:\s*(\S+)/g)].map((match) => match[1]);
    expect(uses.length).toBeGreaterThan(0);
    for (const action of uses) {
      expect(action).toMatch(/@[0-9a-f]{40}$/);
    }
  });
});
