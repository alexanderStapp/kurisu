# "Now Playing" monthly music feature — build plan

Status: **planned, not implemented.** Branch: `chanceDice`.

## Behavior summary
- Arisu monitors one forum channel (the existing **"music"** forum, id in `NOW_PLAYING_FORUM_CHANNEL_ID`).
- On the **1st of each month** (00:00 America/Los_Angeles): create a public Spotify playlist
  `now_playing_{roman}`, then create a forum post titled **"Now Playing, {Month} {Year}"**,
  apply the required **"Now Playing"** forum tag, pin it, and unpin the prior month's post.
- When a user posts a **single-track** Spotify link in one of these threads, add it to **that
  thread's** playlist and react: ✅ added / 🔁 already there / ❌ not a valid single-track link / add failed.

## Resolved design decisions
- **Link routing: thread-scoped** — a link posted in April's thread always adds to April's playlist, even in May.
- **Duplicates: skip and signal** — check the playlist first; if present, react 🔁 and don't re-add.
- **Feedback: emoji reactions** (✅ / 🔁 / ❌). Low-noise; no read-reaction intent needed.
- **Pin rotation: keep only current pinned** — unpin previous month to avoid the forum pin cap.
- **Playlists: public.**
- **Tag:** apply "Now Playing", resolved by name from the forum's `availableTags` at runtime.
- **Numbering:** `sequence` is a monotonic counter of playlists ever created (first = `I`), NOT
  calendar-derived, so a skipped month doesn't skew numbering.
- **Scheduling:** `node-cron` `0 0 1 * *` (LA tz) **plus** a startup catch-up on `ready` (idempotent
  via the DB row), so a bot that's offline at midnight on the 1st still creates the month on next boot.
- **Offline backfill:** out of scope for v1 (real-time messages only). Known limitation.
- **Intro message copy:** `send me a song and i'll add it to this month's playlist\n{link}`

## Key constraint: Spotify auth
Modifying a playlist is **user-scoped**. The app-only Client Credentials flow (like the IGDB setup)
**cannot** modify playlists. Requires the **Authorization Code flow**: a one-time interactive consent
(scopes `playlist-modify-public playlist-modify-private`) mints a **refresh token** stored in
`config.json`; the bot then mints short-lived access tokens headlessly forever after. The authorizing
account **owns** the playlists (dedicated "Arisu" account recommended).

## New / changed files
- New: `models/NowPlayingMonth.js`, `services/spotifyService.js`, `services/nowPlayingService.js`,
  `events/messageCreate.js`, `scripts/spotifyAuth.js`
- Changed: `index.js` (intents), `dbInit.js` (register model), `config.json` (keys),
  `events/ready.js` (startup catch-up + monthly cron)

## Config keys (added to gitignored config.json)
`SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN`, `SPOTIFY_USER_ID`,
`NOW_PLAYING_FORUM_CHANNEL_ID`

## Data model — `models/NowPlayingMonth.js`
| Column | Purpose |
|---|---|
| `year`, `month` | Identify month; unique together → idempotency |
| `sequence` | Monotonic counter → roman numeral in playlist name |
| `forum_thread_id` | Maps an incoming reply back to its playlist |
| `spotify_playlist_id` | Target for track adds |

---

## Phases (each independently verifiable)

### Phase 0 — Prerequisites + scaffolding
- **0a (you):** Create Spotify app in the Developer Dashboard; note Client ID/Secret; add redirect
  URI `http://127.0.0.1:8888/callback`; decide the owning account; provide Spotify User ID.
- **0b (you):** Enable **Message Content Intent** in the Discord Developer Portal.
- **0c (me):** Add config keys; set `index.js` intents → `[Guilds, GuildMessages, MessageContent]`.
- **Gate:** bot still boots (`Ready.` line) with new intents.

### Phase 1 — Spotify layer
- `scripts/spotifyAuth.js` (one-off): localhost:8888 OAuth helper → prints refresh token.
- `services/spotifyService.js`: `getAccessToken()` (cached), `createPlaylist(name)`,
  `playlistHasTrack(playlistId, trackId)`, `addTrack(playlistId, trackUri)`,
  `parseTrackId(text)` (all `/track/` matches; rejects album/playlist/artist/episode).
- **Gate (no Discord):** throwaway snippet creates a playlist, adds a track, dupe check returns true.

### Phase 2 — Persistence
- `models/NowPlayingMonth.js` + register in `dbInit.js`.
- **Gate:** `node dbInit.js` creates `now_playing_months`; `--force` reseeds cleanly.

### Phase 3 — Rollover orchestration — `services/nowPlayingService.js`
- `ensureMonth(client)`: idempotent create of playlist + forum post + tag + pin + unpin-previous + persist.
- `roman(n)` helper (standard 1–3999).
- Temporary dev trigger to fire rollover on demand.
- **Gate (test guild):** creates `now_playing_I` + pinned tagged post linking the playlist; 2nd run no-op;
  simulated next month unpins prior post. Confirm exact v14.25 pin API here (`ChannelFlags.Pinned` via `thread.edit`).

### Phase 4 — Message handling — `events/messageCreate.js`
- Ignore bots; require `channel.isThread()` && `channel.parentId === forumId`; look up row by thread id.
- Parse track links; per track 🔁 / ✅ / ❌; plain chatter ignored.
- **Gate (test guild):** track link → ✅ + appears in playlist; repost → 🔁; album link → ❌; text → no reaction.

### Phase 5 — Scheduling — `events/ready.js`
- `await ensureMonth(client)` on ready; register cron `0 0 1 * *` (America/LA).
- **Gate:** restart → no duplicate post/playlist; cron registered.

### Phase 6 — Docs + finalize (LAYER01 §3)
- Update CLAUDE.md (new event/service/model/config keys + Message Content intent). Sync ARCHITECTURE/ROADMAP if present.
- Run gates (lint + manual test-guild checks), commit + push.

## Reactions legend
✅ added · 🔁 already in playlist · ❌ not a valid single-track link / add failed

## Recommended start
Phase 0c/1 — the Spotify layer is the riskiest and is verifiable in isolation.
