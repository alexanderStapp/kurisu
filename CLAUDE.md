# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Arisu is a Discord bot built on discord.js v14. It uses SQLite via Sequelize for persistence and Puppeteer to drive a local HTML-based text generator.

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
    cooldownBypassPermission: PermissionFlagsBits.Administrator,  // optional; members with this permission skip the cooldown
    data: new SlashCommandBuilder()...,
    async execute(interaction) { ... }
};
```

Cooldowns are **persisted to SQLite** (`command_cooldowns`, via `services/cooldownService.js`), so they survive restarts and deploys — this matters because `/angelvoices` has a 12-hour cooldown. `cooldownBypassPermission` is opt-in per command; only `/angelvoices` sets it.

Adding a new file under `commands/{category}/` is enough to register it at startup. To make it available to users you must also run `node deploy-commands.js`.

### Event handlers (`events/`)

- **`interactionCreate.js`** — routes every `ChatInputCommand` interaction to the matching command, enforces per-user cooldowns, and catches/reports errors. Also routes the color-picker select menu (`customId` `color-select`) to `services/colorRoleService.js`.
- **`ready.js`** — on login: launches a persistent Puppeteer browser that loads `arcanesystems.html` (gitignored, must be present locally), sets bot activity to the generator output, then schedules an hourly cron to refresh it. The Puppeteer `page` object is module-level state inside `services/generatorService.js`.

The client runs on the single `Guilds` intent — the bot does not read message content.

### Database (`models/`, `dbInit.js`)

Models are factory functions: `(sequelize, DataTypes) => sequelize.define(...)`. There is no shared Sequelize singleton yet — each file that needs the DB creates its own instance pointing at `database.sqlite`. Tables:

- `characters` — Smash Bros fighters seeded from `sources/charactersSource.js`, includes voting and elimination fields.
- `users` — Discord user IDs.
- `shiny_attempts` — per-user shiny hunt sessions (user_id, pokemon_id, game_id, attempts, total_time, status).
- `command_cooldowns` — persisted per-user command cooldowns (user_id, command_name, expires_at); unique on `(user_id, command_name)`. Expired rows are deleted lazily on read.
- `color_pickers` — one row per guild (guild_id PK, channel_id, message_id) locating the posted color-picker message so `/post-colors` can edit it in place.

`database.sqlite` also still carries `guild_settings`, `now_playing_months`, and `submitted_songs` from the removed Now Playing feature. Nothing reads or writes them; they are dropped by `node dbInit.js --force`.

`dbInit.js` is the canonical way to seed. `syncdb.js` and `dbObjects.js` are incomplete work-in-progress files and should not be relied upon.

### Configuration (`config.json`)

All credentials live in `config.json` (gitignored): `TOKEN`, `CLIENT_ID`, `GUILD_ID`, `GUILD_ID_TEST`, and IGDB API keys. The file must exist locally; there is no `.env` fallback for the bot.

### Deploy vs. run

These are separate steps. `deploy-commands.js` uses the Discord REST API to register slash commands to `GUILD_ID_TEST` (guild-scoped, instant); `GUILD_ID` and global deployment are present but commented out. The bot process (`npm start`) does not re-register commands — they persist in Discord until explicitly updated or cleared.

### Color picker

`/post-colors <channel>` (`ManageGuild`) posts a message with a dropdown of color roles; picking one swaps the member's current color role for the chosen one, and a `clear` option removes it. Ephemeral confirmation either way.

- The palette is a list of **role names** in `sources/colorsSource.js`. Arisu never creates, renames, or recolors roles — the roles must already exist in the guild with those exact names, and Discord is the single source of truth for what each color looks like.
- `/post-colors` refuses to post if any palette role is missing, if Arisu lacks `ManageRoles`, or if any color role sits **at or above** her highest role (she cannot assign those). It names the offenders instead of publishing a broken menu.
- Hierarchy gotcha: Discord paints a name with the member's **highest colored role**, so any *other* colored role above the palette (e.g. an `Owner` role) silently wins and the color appears not to change.
- The menu is routed by `customId`, not a collector, so it survives restarts indefinitely. Re-running `/post-colors` edits the existing message in place (or moves it to a new channel) rather than posting a duplicate — the message is tracked in `color_pickers`.

### Spotify: do not attempt

A "Now Playing" feature (monthly forum thread → Spotify playlist) was built and then removed. Anything that needs to **read or write Spotify playlist contents is impossible** for this bot, and this is a policy wall, not a configuration problem:

- Apps in Spotify **Development Mode** get `403 Forbidden` on playlist-contents endpoints. `GET /playlists/{id}/tracks` 403s for *every* playlist, including public ones the app owns, and the `tracks` field is stripped from the playlist object entirely. Playlist **metadata** (name, owner, images) and the **catalog** endpoints (`/search`, `/tracks/{id}`) still return `200`.
- Playlist writes (`POST /users/{id}/playlists`, adding tracks) 403 the same way, even for an app owned by the target account.
- **Extended Quota Mode**, which would lift this, has been restricted to scaled/commercial apps since 2025-05-15. Hobby apps cannot get it.
- There is no playlist webhook/event API; it is poll-only even if you had access.

A bot account also cannot display the real Spotify "Listening to" rich-presence card — that comes from a *user* account's Spotify connection. A bot can only set a plain activity, and Discord renders **one** activity at a time (extra entries in the `activities` array are silently dropped). A non-Custom activity's `state` field does render as a second line, but only in the profile popout, never in the member list.

### CI/CD

`.github/workflows/main.yml` triggers on push to `master`: SSHes into a remote server and runs `git pull`. There is no build or test step in CI.
