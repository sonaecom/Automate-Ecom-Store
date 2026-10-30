# Configuration

## Environment variables

| Variable | Required | Meaning |
| --- | --- | --- |
| `ADSPOWER_API_BASE` | for `runner: adspower` | AdsPower Local API base URL |
| `ADSPOWER_API_KEY` | for `runner: adspower` | AdsPower API key (Automation → API) |
| `MKTLOGIN_API_BASE` | for `runner: mktlogin` | MKTLogin local API, default `http://localhost:4980` |
| `MKTLOGIN_API_KEY` | optional | MKTLogin API key if enabled |

See [`.env.example`](../.env.example). Keep the real values outside the repo.

## Private files on the shop computer

| File | Content |
| --- | --- |
| `~/.automate-ecom-store/config.yaml` | API key and onboarding answers (mode 600) |
| `~/.automate-ecom-store/stores.yaml` | Per-store config, read by `scripts/apply-stores.mjs` at every run |

## `stores.yaml`

Example: [`examples/stores.yaml`](../examples/stores.yaml); full commented shape: `skills/automate-ecom-store/stores.example.yaml`.

| Key | Meaning |
| --- | --- |
| `label` | Private label for the store |
| `platform` | `shopee`, `tiktokshop`, or `lazada` |
| `market` | Market code |
| `profile_id` | Anti-detect profile id — never committed |
| `runner` | `adspower` (default) or `mktlogin` |
| `mode` | `read_only` (default) or `full` |
| `schedule` | `gap_hours_min`, `gap_hours_max`, `session_minutes_max`, optional `night: off` |
| `caps.session` / `caps.daily` | Owner caps; anything above the ceiling is ignored |

## Targets

Targets (`modules/affiliate/targets.example.yaml`) are set by each owner and are never hard-coded. An empty target is not a reason to work up to the ceiling. Numbers such as "2,000 invites" are examples of what an owner might type, not defaults.
