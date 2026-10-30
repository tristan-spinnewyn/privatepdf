// @vitest-environment node
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const workflow = readFileSync(resolve(process.cwd(), '.github/workflows/ci.yml'), 'utf8');
const dependabotPath = resolve(process.cwd(), '.github/dependabot.yml');

describe('CI workflow', () => {
  it('pins every action to a full commit SHA', () => {
    const uses = [...workflow.matchAll(/uses:\s*(\S+)/g)].map((match) => match[1]);
    expect(uses.length).toBeGreaterThan(0);
    for (const action of uses) {
      expect(action).toMatch(/@[0-9a-f]{40}$/);
    }
  });

  it('does not persist the GitHub token in checkouts', () => {
    const checkouts = workflow.match(/uses:\s*actions\/checkout@/g) ?? [];
    const disabled = workflow.match(/persist-credentials:\s*false/g) ?? [];
    expect(disabled.length).toBe(checkouts.length);
  });

  it('takes the pnpm version from package.json instead of duplicating it', () => {
    expect(workflow).not.toMatch(/pnpm\/action-setup@\S+[^\n]*\n\s+with:\s*\n\s+version:/);
  });

  it('fails on known high severity vulnerabilities', () => {
    expect(workflow).toMatch(/pnpm audit --audit-level high/);
  });

  it('runs the built image and checks the healthcheck, worker MIME type and CSP', () => {
    expect(workflow).toMatch(/load:\s*true/);
    expect(workflow).toMatch(/docker run[^\n]*-p\s+\d+:3000/);
    expect(workflow).toMatch(/\.State\.Health\.Status/);
    expect(workflow).toMatch(/pdf\.worker\.min\.mjs/);
    expect(workflow).toMatch(/application\/javascript/);
    expect(workflow).toMatch(/content-security-policy/i);
  });
});

describe('Dependabot configuration', () => {
  it('keeps npm packages, GitHub Actions and Docker base images up to date', () => {
    expect(existsSync(dependabotPath)).toBe(true);
    const config = readFileSync(dependabotPath, 'utf8');
    for (const ecosystem of ['npm', 'github-actions', 'docker']) {
      expect(config).toMatch(new RegExp(`package-ecosystem:\\s*"?${ecosystem}"?`));
    }
  });

  it('ignores updates the project deliberately does not follow automatically', () => {
    const config = readFileSync(dependabotPath, 'utf8');
    // Node majors (Node 25+ drops corepack, used by the Dockerfile) and their typings follow the runtime
    expect(config).toMatch(/dependency-name:\s*"node"\s*\n\s*update-types:\s*\["version-update:semver-major"\]/);
    expect(config).toMatch(/dependency-name:\s*"@types\/node"\s*\n\s*update-types:\s*\["version-update:semver-major"\]/);
    // nginx odd minors are the mainline branch; stay on the stable one
    expect(config).toMatch(
      /dependency-name:\s*"nginxinc\/nginx-unprivileged"\s*\n\s*update-types:\s*\["version-update:semver-minor"\]/
    );
  });
});
