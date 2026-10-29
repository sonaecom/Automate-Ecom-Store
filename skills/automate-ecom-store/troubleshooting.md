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
| AdsPower shows logged out, or the seller page asks for a password | Stop. The person logs in inside that same visible profile. Do not type the password. Do not open a normal browser to finish the login. |
| Proxy error, proxy disconnected, or the country on screen is not the store's country | Stop. Do not click through. Do not edit the proxy, the IP, or the fingerprint. Tell the owner. Do not open the store again in this session. |
| A menu, button, or column name does not match the module | Stop and ask. Do not click through other menus to find it. Add a lesson after the session. |
| A second captcha in the same day, or captcha review is `REVIEW` | Do not start. Do not open another store to "use up" the captchas. Do not change the proxy. |
| Two exports disagree | Report both figures. Do not pick one and do not publish. |
| Headless is requested | Stop. The window stays visible. |
| Google token missing | Offer the connection again only if they ask. The rest of the skill still runs. |
| Viewer tried to publish | `audit-log.mjs` returns `DENIED`. Do not publish. |

Do not clear cookies, change the proxy, or open a second seller tab to get past any row in this table.
