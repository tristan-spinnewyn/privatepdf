# Security Policy

## Supported versions

Only the latest version of the `main` branch (the image published as
`ghcr.io/tristan-spinnewyn/privatepdf:latest`) receives security fixes.

## Reporting a vulnerability

Please **do not open a public issue** for security problems.

Report them privately through GitHub instead:
[Report a vulnerability](https://github.com/tristan-spinnewyn/privatepdf/security/advisories/new).

Include the affected version or commit, the steps to reproduce and the impact you observed.
You should get a first answer within 7 days. Once a fix is released, the advisory is published
and you are credited unless you prefer otherwise.

## Scope

PrivatePDF processes every file in the browser and never uploads it. Of particular interest:

- anything that sends file contents, file names or other user data to a server
- ways to bypass the Content-Security-Policy or run injected scripts
- malicious PDF or image files that execute code or leak data
- weaknesses in the Docker image, the nginx configuration or the CI/CD pipeline

Crashes of the browser tab caused by very large files are known limitations, not vulnerabilities.
