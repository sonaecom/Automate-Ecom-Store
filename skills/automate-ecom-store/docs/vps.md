# Linux VPS

The primary host is a Linux VPS that stays on. OpenClaw, Hermes Agent, and AdsPower are installed on that same machine. The seller window is headed. It is drawn on a virtual display, not in AdsPower headless mode. `headless` in config stays false, and `open-browser` still sends `"headless":"0"`.

A session is still 30–40 minutes, then idle, then at least `gap_hours_min` hours (2–3) before the same store opens again. One profile at a time. The machine being up all day is not a reason to skip the gap, the pace, the captcha stop, or the queue.

No address, port, or key belongs in this repo. The private values are `<ADSPOWER_API_BASE>` and `<API_KEY>` in `/etc/automate-ecom-store/adspower.env`, copied from `deploy/adspower.env.example`.

## Install order

1. A virtual display. Package name on the distro is the Xvfb package. The unit is `deploy/systemd/automate-ecom-display.service`. Replace `<DISPLAY>` on the machine. Do not commit that edit.
2. AdsPower, the ordinary desktop build, started with `DISPLAY` set to that virtual display. Do not enable its headless client switch. The unit is `deploy/systemd/automate-ecom-adspower.service`. `<ADSPOWER_BIN>` is the AdsPower executable path on that machine.
3. Node, then this repo. Install the skill with the OpenClaw command already in the README, or point Hermes Agent at the same `skills/automate-ecom-store` directory.
4. The agent unit. Enable OpenClaw or Hermes Agent, not both, as the process that opens seller sessions. The other may be installed and left disabled.
5. The wake timer. `deploy/systemd/automate-ecom-tick.timer` runs `unattended-tick.mjs`. That script does not open a profile.

Replace `<NODE_BIN>`, `<SKILL_DIR>`, `<STATE_FILE>`, `<CAPTCHA_LOG>`, `<GAP_HOURS_MIN>`, `<PLATFORM>`, `<REPO_DIR>`, `<OPENCLAW_BIN>`, and `<HERMES_BIN>` in the unit files on the machine.

## AdsPower local API

The agent uses the official AdsPower MCP or CLI. The base URL is the environment variable `ADSPOWER_API_BASE`. When that variable is empty, the client uses its usual local API address. Do not write the address into `config.yaml` in git, a unit file in git, or a chat log. If the saved config and the environment disagree, account safety says stop without printing either value.

## OpenClaw and Hermes Agent

Both are agent hosts for this skill. They are compatible when each of them does all of the following:

- Read `SKILL.md`, then `account-safety.md`, before a seller click.
- Call `unattended-tick.mjs` and open a profile only on `result: READY`.
- Enqueue work with `task-queue.mjs` and refuse a second store while the result is `BUSY`.
- Use `delay-range.mjs` for every wait. Do not replace it with a fixed sleep.
- Leave `headless` false and pass `"headless":"0"` to `open-browser`.
- Stop on captcha review `REVIEW`, and on `TIME_UP`, and write a queue checkpoint.
- Leave `~/.automate-ecom-store` in place across an update.

They are not compatible with each other on the same profile at the same time. One session lock, one browser window. Enable one agent unit. Leave the other disabled until the first is stopped and the queue is not `BUSY`.

This repo does not vendor either host. Install each one by its own current installer. Point it at this skill directory. Do not add its token or its host name here.

## Supervision

systemd restarts a dead process. It does not start a new seller session by itself.

| Unit | Role |
| --- | --- |
| `automate-ecom-display.service` | Virtual display. `Restart=on-failure`. |
| `automate-ecom-adspower.service` | Headed AdsPower on that display. `Restart=on-failure`. |
| `automate-ecom-openclaw.service` | OpenClaw, if it is the active agent. |
| `automate-ecom-hermes.service` | Hermes Agent, if it is the active agent. |
| `automate-ecom-tick.timer` | Wake every 15 minutes and once after boot. |

`Restart=on-failure` covers a crash. It must not be used to relaunch `open-browser` in a loop. After a restart, the agent runs the tick again. `WAIT` means stay idle.

## Logs

Process logs are the journal. No extra log host.

```bash
journalctl -u automate-ecom-display.service
journalctl -u automate-ecom-adspower.service
journalctl -u automate-ecom-openclaw.service
journalctl -u automate-ecom-hermes.service
journalctl -u automate-ecom-tick.service
```

Skill state stays on the VPS under `~/.automate-ecom-store/data/` and `~/.automate-ecom-store/screenshots/`. Those paths are not in git. A captcha note must not include a key, an address, or a profile id.

## Unattended day

The timer, or the agent loop, runs:

```bash
node <SKILL_DIR>/scripts/unattended-tick.mjs --state <STATE_FILE> --gap-hours <GAP_HOURS_MIN> --csv <CAPTCHA_LOG> --platform <PLATFORM>
```

| Result | What the agent does |
| --- | --- |
| `WAIT` | Do not call `open-browser`. The gap, a captcha block, or captcha review still applies. |
| `READY` | Plan one store with `task-queue.mjs`. Start that session only. |
| `BUSY` | Another profile is in a session. Do not open a second one. |
| `TIME_UP` | Checkpoint the chunk, `--end-session`, idle on seller home. |

Pace inside the session uses `delay-range.mjs` profiles `safe`, `normal`, and `fast` (`normal` by default). Clicks are direct and uneven, with a 300ms floor on `normal` and `fast`. Page-load settles stay. A batch rest after 10–15 actions is still 120–300 seconds. A captcha sets the pace multiplier to 2 for the rest of that session and never shortens a gap. An optional red dot follows `show_click_dot`.

The queue's daily plan still says what fits today and what moves to tomorrow. A restart does not clear that queue and does not skip a checkpoint.

A real-store round uses the executor. Install dependencies once in the skill folder, with the browser binary, and export the AdsPower base and key in the environment for that command only. Do not write them into the repo.

```bash
cd <SKILL_DIR>
npm install
npx playwright install chromium
node scripts/real-test.mjs --store <PROFILE_ID> --module listing.edit --round 1 --max-actions 3 --platform shopee --mode read_only --day <YYYY-MM-DD> --journal ~/.automate-ecom-store/data/journal/round.jsonl
```

`--mode full` is required before a reversible listing edit or ads toggle. The round file records `store_hash`, not the profile id. Unit tests are `node --test tests/unit/*.test.mjs` from the repo root. `node --test tests/unit/` does not run this folder.

## Safe update

Do this only when the tick is `WAIT` and the queue is not `BUSY`.

1. `systemctl stop` the active agent unit (OpenClaw or Hermes). Leave the display and AdsPower units up unless you are upgrading AdsPower itself.
2. From the repo: `node skills/automate-ecom-store/scripts/update.mjs`. It fast-forwards git and must leave `~/.automate-ecom-store/config.yaml`, `stores.yaml`, and the Google token files unchanged. `result: OK` is required. A failed pull stops here. Do not reset config.
3. `systemctl start` the same agent unit.
4. Run the tick once. Do not open a store until it prints `READY`.

Do not copy `/etc/automate-ecom-store/adspower.env` into the repo as part of the update.
