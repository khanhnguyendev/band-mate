# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| Latest (`main`) | Yes |

Older versions are not actively patched. We recommend keeping up-to-date.

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Email the maintainers at: **security@bandmate.app**

Include as much of the following as possible:

- A description of the vulnerability and its potential impact
- The affected component(s) — API, frontend, queue worker, wallet logic
- Steps to reproduce or a proof-of-concept
- Any suggested mitigations (optional)

You will receive an acknowledgement within **48 hours** and a full response within **7 days**.

## Disclosure Policy

We follow [responsible disclosure](https://en.wikipedia.org/wiki/Coordinated_vulnerability_disclosure). Once a fix is available we will:

1. Release a patched version.
2. Publish a security advisory crediting the reporter (unless anonymity is requested).

## Scope

Areas of particular concern for this platform:

- **Auth and sessions** — JWT secret exposure, token theft, session fixation
- **Credit wallet** — Race conditions that allow credits to go negative or allow over-spend
- **Audio uploads** — Unsigned or misconfigured S3 pre-signed URLs exposing user audio
- **AI prompt injection** — Learner input crafted to manipulate scoring prompts
- **Admin endpoints** — Privilege escalation, missing role checks
- **Rate limits** — Bypass techniques that allow unlimited AI scoring without credits

Vulnerabilities in third-party dependencies should be reported to the respective upstream projects. Open a regular issue here to track upgrading the dependency once a fix is available upstream.
