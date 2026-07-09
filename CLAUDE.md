# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Arisu is a Discord bot built on discord.js v14. It uses SQLite via Sequelize for persistence and Puppeteer to drive a local HTML-based text generator. It also runs a monthly "Now Playing" music feature that collects song submissions in a forum channel (see below).

## Commands

```bash
npm start          # start the bot (node .)
npm run lint       # run ESLint
node deploy-commands.js   # register slash commands with Discord (must run after adding/renaming commands)
node dbInit.js            # seed the database from sources/charactersSource.js
node dbInit.js --force    # drop and recreate tables before seeding
```

There is no test suite (`npm test` exits 1).

## Architecture

### Bot startup (`index.js`)

On start, `index.js` dynamically scans `commands/{category}/` and `events/` and loads everything it finds. A command file is registered only if it exports both `data` (a `SlashCommandBuilder`) and `execute`. The client holds two `Collection` maps: `client.commands` and `client.cooldowns`.

### Command shape

Every command file in `commands/` must export:

```js
module.exports = {
    category: 'fun' | 'search' | 'utility',
    cooldown: 5,          // optional, seconds; defaults to 3 in interactionCreate.js
    data: new SlashCommandBuilder()...,
    async execute(interaction) { ... }
};
```

Adding a new file under `commands/{category}/` is enough to register it at startup. To make it available to users you must also run `node deploy-commands.js`.

### Event handlers (`events/`)

- **`interactionCreate.js`** — routes every `ChatInputCommand` interaction to the matching command, enforces per-user cooldowns, and catches/reports errors.
- **`ready.js`** — on login: launches a persistent Puppeteer browser that loads `arcanesystems.html` (gitignored, must be present locally), sets bot activity to the generator output, then schedules an hourly cron to refresh it. The Puppeteer `page` object is module-level state inside `services/generatorService.js`. Also runs the Now Playing startup catch-up (`ensureAllMonths`) and registers the monthly rollover cron.
- **`messageCreate.js`** — Now Playing: watches for single-track Spotify links posted in managed forum threads and forwards them to the guild's admin song channel.
- **`messageReactionAdd.js`** — Now Playing: relays the admin's ✅/❌ on a forwarded submission back onto the original user's message. Requires the `GuildMessageReactions` intent plus the `Message`/`Channel`/`Reaction` partials (set in `index.js`).

### Database (`models/`, `dbInit.js`)

Models are factory functions: `(sequelize, DataTypes) => sequelize.define(...)`. There is no shared Sequelize singleton yet — each file that needs the DB creates its own instance pointing at `database.sqlite`. Tables:

- `characters` — Smash Bros fighters seeded from `sources/charactersSource.js`, includes voting and elimination fields.
- `users` — Discord user IDs.
- `shiny_attempts` — per-user shiny hunt sessions (user_id, pokemon_id, game_id, attempts, total_time, status).
- `guild_settings` — per-guild Now Playing config (guild_id, music_forum_channel_id, song_channel_id).
- `now_playing_months` — one row per guild/month (guild_id, year, month, sequence, forum_thread_id); `sequence` is the per-guild monotonic counter rendered as a roman numeral.
- `submitted_songs` — Now Playing submissions (guild_id, year, month, track_id, thread/admin message ids, status); unique on `(guild_id, year, month, track_id)` gives per-month dedup.

`dbInit.js` is the canonical way to seed. `syncdb.js` and `dbObjects.js` are incomplete work-in-progress files and should not be relied upon.

### Configuration (`config.json`)

All credentials live in `config.json` (gitignored): `TOKEN`, `CLIENT_ID`, `GUILD_ID`, `GUILD_ID_TEST`, and IGDB API keys. The file must exist locally; there is no `.env` fallback for the bot.

### Deploy vs. run

These are separate steps. `deploy-commands.js` uses the Discord REST API to register slash commands to `GUILD_ID_TEST` (guild-scoped, instant); `GUILD_ID` and global deployment are present but commented out. The bot process (`npm start`) does not re-register commands — they persist in Discord until explicitly updated or cleared.

### Now Playing feature

A monthly music feature spanning `services/nowPlayingService.js`, the `messageCreate`/`messageReactionAdd` events, and three `utility` commands. It uses no external music API — it only moves links and reactions around Discord.

- **Setup (per guild, admin-only, `ManageGuild`):** `/set-music-forum` sets the forum channel to watch; `/set-song-channel` sets the admin text channel submissions are forwarded to. Both persist into `guild_settings`.
- **Month rollover** (`ensureMonthForGuild`, driven by ready-time catch-up, a monthly cron, or `/init-now-playing`): creates a pinned forum thread "Now Playing, {Month} {Year}" (tagged "Now Playing"), unpins the prior month, and posts `create new playlist, title: now_playing_{roman}` to the admin channel. Idempotent per guild/month via `now_playing_months`; the DB row is saved before the best-effort pin so a missing permission can't spawn duplicate posts.
- **Submission flow:** a user posts a single-track Spotify link in a managed thread → the bot dedups it, reacts ⏳ on the user's message, and forwards the link to the admin channel with ✅/❌ pre-added. An admin adds the track to the playlist by hand, then clicks ✅ (success) or ❌ (fail); the bot relays that decision back as ✅/❌ on the original user's message. Reactions: ⏳ pending, ✅ added, 🔁 duplicate this month, ❌ invalid link / failed.
- **Intents:** requires `GuildMessages`, `MessageContent` (privileged), and `GuildMessageReactions`, plus `Message`/`Channel`/`Reaction` partials — all set in `index.js`.

### CI/CD

`.github/workflows/main.yml` triggers on push to `master`: SSHes into a remote server and runs `git pull`. There is no build or test step in CI.
