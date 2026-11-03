// @vitest-environment node
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const workflow = readFileSync(resolve(process.cwd(), '.github/workflows/ci.yml'), 'utf8');
const workspacePath = resolve(process.cwd(), 'pnpm-workspace.yaml');
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

  it('scans the built image for high and critical vulnerabilities', () => {
    expect(workflow).toMatch(/uses:\s*anchore\/scan-action@/);
    expect(workflow).toMatch(/severity-cutoff:\s*high/);
    expect(workflow).toMatch(/fail-build:\s*true/);
    // Vulnerabilities without a released fix cannot be acted on and must not block every PR
    expect(workflow).toMatch(/only-fixed:\s*true/);
  });

  it('audits the GitHub Actions workflows with zizmor', () => {
    expect(workflow).toMatch(/uses:\s*zizmorcore\/zizmor-action@/);
  });

  it('uses the same Node major as the Docker build stage', () => {
    const dockerfile = readFileSync(resolve(process.cwd(), 'Dockerfile'), 'utf8');
    const dockerNodeMajor = dockerfile.match(/^FROM\s+node:(\d+)\./m)?.[1];
    expect(workflow).toMatch(new RegExp(`node-version:\\s*${dockerNodeMajor}\\b`));
  });

  it('runs the end-to-end suite against the built image', () => {
    expect(workflow).toMatch(/playwright install --with-deps chromium/);
    expect(workflow).toMatch(/E2E_BASE_URL:\s*http:\/\/localhost:8080/);
    expect(workflow).toMatch(/pnpm test:e2e/);
  });

  it('runs the built image and checks the healthcheck, worker MIME type and CSP', () => {
    expect(workflow).toMatch(/load:\s*true/);
    expect(workflow).toMatch(/docker run[^\n]*-p\s+\d+:3000/);
    expect(workflow).toMatch(/\.State\.Health\.Status/);
    expect(workflow).toMatch(/assets\/pdf\.worker\.min-\*\.mjs/);
    expect(workflow).toMatch(/application\/javascript/);
    expect(workflow).toMatch(/content-security-policy/i);
    expect(workflow).toMatch(/cache-control:[^\n]*no-cache/i);
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

  it('waits a week before proposing a new release, so compromised versions get caught first', () => {
    const config = readFileSync(dependabotPath, 'utf8');
    const cooldowns = [...config.matchAll(/cooldown:\s*\n\s*default-days:\s*(\d+)/g)].map((match) => Number(match[1]));
    expect(cooldowns).toHaveLength(3);
    for (const days of cooldowns) {
      expect(days).toBeGreaterThanOrEqual(7);
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

describe('pnpm settings', () => {
  it('refuses to resolve package versions published less than three days ago', () => {
    const settings = readFileSync(workspacePath, 'utf8');
    const minutes = Number(settings.match(/^minimumReleaseAge:\s*(\d+)/m)?.[1]);
    expect(minutes).toBeGreaterThanOrEqual(3 * 24 * 60);
  });

  it('ships the pnpm settings to the Docker build before installing dependencies', () => {
    const dockerfile = readFileSync(resolve(process.cwd(), 'Dockerfile'), 'utf8');
    expect(dockerfile).toMatch(/COPY package\.json pnpm-lock\.yaml pnpm-workspace\.yaml \.\/\s*\n[\s\S]*pnpm install/);
  });
});
