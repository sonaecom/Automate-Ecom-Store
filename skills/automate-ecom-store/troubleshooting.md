# Troubleshooting

Work on the shop computer, in the visible AdsPower window. Do not switch the store into another browser to "fix" a login.

| What you see | What to do |
| --- | --- |
| `--status` says `MISSING` | Ask for the AdsPower API key only. Do not ask for an address yet. |
| Profile list fails and `api_base` is `default` | Ask once for the address in AdsPower, Automation, API. Save it. Retry once. Do not invent a host or a port. |
| Profile list fails and `api_base` is `custom` | Stop. Ask the person to open the AdsPower app. |
| `NEED_STORES` | List profiles by name and number. Do not show profile ids. |
| `POLICY_PENDING` on a publish or a price | Stop that change. Read-only work can continue. The market policy file is not in `policy/<platform>/` yet. |
| `STALE` | Run `policy-update.mjs`, tell the owner, do not mutate. |
| Captcha | One human-paced slider try, then stop, screenshot, and hand the screen to a person. |
| Two exports disagree | Report both figures. Do not pick one and do not publish. |
| Headless is requested | Stop. The window stays visible. |
| Google token missing | Offer the connection again only if they ask. The rest of the skill still runs. |
| Viewer tried to publish | `audit-log.mjs` returns `DENIED`. Do not publish. |

Do not clear cookies, change the proxy, or open a second seller tab to get past any row in this table.
