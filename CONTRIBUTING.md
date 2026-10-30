# Contributing

Thanks for helping. This project automates real seller accounts, so safety rules come before features.

## Ground rules

1. One skill: edit modules under `skills/automate-ecom-store/modules/`. Do not add a second `SKILL.md`.
2. No direct marketplace APIs, internal endpoints, request replay, or injected scripts.
3. Never commit keys, hosts, IPs, ports, profile ids, shop names, staff names, product names, or creator handles. Use `<PLACEHOLDER>` values. Sample data must be marked `synthetic`.
4. Never raise a ceiling in `core/targets.mjs` or `account-safety.md` without owner sign-off.
5. Money actions (top-up, withdraw, pay, budget, refund) stay refused or owner-approved proposals.

## Workflow

```bash
git clone https://github.com/sonaecom/Automate-Ecom-Store.git
cd Automate-Ecom-Store
git config core.hooksPath .githooks       # secret, hygiene and private-name scans before push
cd skills/automate-ecom-store && npm install && npm test
```

1. Branch from `main`.
2. Add or update unit tests in `tests/unit/` (mock runners; never touch a real store in tests).
3. Update `skills/automate-ecom-store/CHANGELOG.md` and `VERSION` (semver) for skill changes.
4. Open a pull request using the template. CI must be green.

## Commit style

Short imperative subject, plain-language body explaining *why*.
