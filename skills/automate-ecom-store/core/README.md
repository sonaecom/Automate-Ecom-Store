# Core

The runner decides if one module action may start. It does not open a browser.

1. The module manifest must match `schema/module-manifest.schema.json`.
2. `safety/read-only.mjs` blocks a write when the store mode is not `full`, and blocks money movement in every mode.
3. Policy text is only `policies/rules.yaml`, loaded by `policy/index.mjs`. There is no second copy.
4. `journal/action-key.mjs` records `store|module|action|target|day`. A key already marked done is not run again that day.

`runner.mjs` applies those four checks and returns `RUN`, `SKIP`, `READ_ONLY`, `MONEY_BLOCKED`, `POLICY`, or `MANIFEST`.

`pace.mjs` is the human pace for every module. Profiles are `safe`, `normal`, and `fast`. `normal` is the default. Clicks are direct. Gaps are uneven and stay at or above the profile floor. `delay-range.mjs` is the clock. An optional red dot is `--red-dot on`.

A filename must not end with a dot. `scripts/repo-hygiene.mjs` rejects one. No tracked file currently ends with a dot.
