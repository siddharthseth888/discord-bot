# Discord Gemini Bot

A Discord bot built with **Node.js** and **discord.js** that answers questions using Google's **Gemini** API. Mention the bot in a server channel, and it replies using the Gemini model you configure (for example `gemini-3.8-flash`).

## Features

- Replies to messages that **@mention** the bot, powered by the Gemini API
- Greets users by their server name
- Slash commands (e.g. `/ping`) loaded automatically from the `commands/` folder
- Modular structure: each command and event lives in its own file
- Automatic retry when Gemini is busy (503/429 errors), with optional fallback model
- Per-user cooldown and long-reply splitting to respect Discord's 2000-character limit

## Dependencies / Tech Stack

| Purpose | Package |
|---|---|
| Discord API | `discord.js` ^14.27.0 |
| Gemini API | `@google/genai` ^2.28.0 |
| Environment variables | `dotenv` ^18.0.7 |

Requires **Node.js 20 or newer** (a current LTS version is recommended).

## Project Structure

```
discord-bot/
├── commands/              # Slash commands (one file per command)
│   └── ping.js
├── events/                # Discord event handlers
│   ├── ready.js
│   ├── interactionCreate.js
│   └── messageCreate.js   # Mention -> Gemini reply
├── utils/
│   └── gemini.js          # Gemini API wrapper with retry logic
├── deploy-commands.js     # Registers slash commands with Discord
├── index.js               # Entry point and file loader
├── package.json
├── .env                   # Secrets (never commit this)
└── .gitignore
```

## Setup

### 1. Create the Discord application

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications) and create a **New Application**.
2. Open the **Bot** tab:
   - Click **Reset Token** and copy the token (shown only once).
   - Under **Privileged Gateway Intents**, enable **Message Content Intent** and save. Without it the bot cannot read message text.
3. Open **OAuth2 → URL Generator**:
   - Scopes: `bot` and `applications.commands` (nothing else).
   - Select only the bot permissions you need (for example Send Messages, Read Message History, Embed Links).
   - Open the generated URL and add the bot to your server.

### 2. Get a Gemini API key

Create a key in [Google AI Studio](https://aistudio.google.com/app/apikey). Check the model list there for the current model names.

### 3. Get your IDs

Enable **Developer Mode** in Discord (User Settings → Advanced). Then:

- **Client ID:** Developer Portal → your application → General Information
- **Guild (server) ID:** right-click your server → **Copy Server ID**

### 4. Install dependencies

```bash
git clone https://github.com/siddharthseth888/discord-bot.git
cd discord-bot
npm install
```

### 5. Configure environment variables

Create a `.env` file in the project root:

```env
DISCORD_TOKEN=your_discord_bot_token
CLIENT_ID=your_discord_application_client_id
GUILD_ID=your_discord_server_id
GEMINI_API_KEY=your_api_key_from_google_ai_studio
GEMINI_MODEL=gemini-3.8-flash
# Optional: used if the main model is overloaded
# GEMINI_FALLBACK_MODEL=another_model_name
```

| Variable | Where to get it |
|---|---|
| `DISCORD_TOKEN` | Developer Portal → Bot → Reset Token |
| `CLIENT_ID` | Developer Portal → General Information |
| `GUILD_ID` | Right-click your server → Copy Server ID |
| `GEMINI_API_KEY` | Google AI Studio |
| `GEMINI_MODEL` | Model name from Google AI Studio |

> **Never commit `.env`.** It must be listed in `.gitignore`. If a token or key is ever exposed, reset it immediately in the Developer Portal or AI Studio.

### 6. Register slash commands and start the bot

```bash
node deploy-commands.js   # run once, and again after adding or changing commands
node index.js
```

You should see `Logged in as <bot name>` in the terminal, and the bot will show as online in your server.

## Usage

In any channel the bot can read, mention it:

```
@bot-for-node hello bot, how are you?
@bot-for-node give me a short summary of the French Revolution
```

Make sure you select the bot from Discord's mention popup so it becomes a highlighted mention. Slash commands:

| Command | Description |
|---|---|
| `/ping` | Replies with "Pong!" |

## Adding a New Command

1. Create a file in `commands/`, for example `commands/hello.js`:

```js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('hello').setDescription('Says hello'),
  async execute(interaction) {
    await interaction.reply(`Hello, ${interaction.user.username}!`);
  },
};
```

2. Run `node deploy-commands.js`, then restart the bot.

## Deployment

The bot only stays online while the process is running. To keep it online without your computer:

- **VPS (recommended):** install Node, clone the repo, add `.env`, then run with `pm2 start index.js --name bot`.
- **Render:** free web services spin down after about 15 minutes without web traffic, and background workers are paid. `index.js` includes a small HTTP endpoint that an uptime monitor can ping to keep a free web service awake, but this is not fully reliable.

Set all environment variables in the host's dashboard instead of uploading `.env`. Run only one instance of the bot at a time, or it will reply twice.

## Troubleshooting

| Problem | Likely cause and fix |
|---|---|
| Bot is online but ignores messages | Message Content Intent is off, or you did not use a real @mention. Enable the intent, save, and restart. |
| `Used disallowed intents` | Enable Message Content Intent in the Developer Portal. |
| `TokenInvalid` | Wrong or expired `DISCORD_TOKEN`. Reset it and update `.env`. |
| Slash command missing | Run `node deploy-commands.js` again and reload Discord (`Ctrl + R`). |
| Gemini `404` model error | The model name is retired. Update `GEMINI_MODEL` to a current one from AI Studio. |
| Gemini `503` / `429` | Model overloaded or rate-limited. The bot retries automatically; try again or set `GEMINI_FALLBACK_MODEL`. |

## Security Notes

- Keep `.env` out of Git and keep the repository private if it contains anything sensitive.
- Grant the bot only the permissions it needs.
- Rotate keys immediately if they are ever shared or committed.
