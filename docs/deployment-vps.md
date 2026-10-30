# Deployment on a Linux VPS

Detailed guide: `skills/automate-ecom-store/docs/vps.md`. Summary:

1. **Display.** Run a virtual display (`deploy/systemd/automate-ecom-display.service`). A virtual display is not headless mode — profiles stay headed.
2. **Browser.** Install AdsPower (`deploy/systemd/automate-ecom-adspower.service`, env shape in `deploy/adspower.env.example`) or MKTLogin.
3. **Node.js ≥ 22**, then:
   ```bash
   git clone https://github.com/sonaecom/Automate-Ecom-Store.git
   cd Automate-Ecom-Store/skills/automate-ecom-store
   npm install && npx playwright install chromium
   ```
4. **Agent host.** OpenClaw (`automate-ecom-openclaw.service`) or Hermes Agent (`automate-ecom-hermes.service`).
5. **Scheduler.** `automate-ecom-tick.timer` runs the unattended tick; seller sessions still wait for the 2–3 h gap and stay within 30–40 min.
6. **Secrets.** Put env vars in a root-only environment file referenced by the unit, never in the repo.
7. **Update** without touching local config: `node skills/automate-ecom-store/scripts/update.mjs`.

systemd restarts a dead process; it does not extend a seller session.
