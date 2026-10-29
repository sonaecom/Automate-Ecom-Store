# Official API roadmap

Today the skill uses the seller centre screens and official exports. AdsPower opens the profile through the official `adspower-browser` skill, MCP, or CLI. The address is `<ADSPOWER_API_BASE>` in the private config, empty when the client default works.

Later, a store that already has an official seller API may add a read-only export through that API. The agent still does two-source QC against the screen or a second export. Writes stay on the screen, at a human pace, inside the caps.

Not on the roadmap, and not allowed now:

- Undocumented or internal seller endpoints
- Replaying network calls from the browser
- A script that tops up, withdraws, or registers a campaign by itself
- Headless mode

When an official API is added, record its public documentation URL and retrieved date in `policy/sources.yaml`. Do not put a key in that file.
