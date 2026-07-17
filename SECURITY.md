# Security Policy

## Reporting a vulnerability

Do not publish credentials, tokens, personal data, or vulnerability details in a public issue.

Report the problem privately to the Team ALMOND project team through the approved team communication channel. Include:

- the affected file, route, or component;
- steps needed to reproduce the problem;
- the expected and actual behaviour;
- the potential impact;
- a suggested fix, if available.

If a credential may have been exposed, revoke or rotate it immediately and remove it from the repository and Git history before continuing development.

## Repository security baseline

The repository must not commit:

- `.env`, `.env.local`, or other local environment files;
- Azure Speech keys or other service credentials;
- personal LAN IP addresses;
- generated build output or dependency directories.

`.env.example` may contain variable names and empty or clearly non-secret example values only.

Pull requests must pass the automated quality and security gate before merge.