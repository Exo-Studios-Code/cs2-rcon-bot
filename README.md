# CS2 RCON Bot

A Discord bot for managing a CS2 server through RCON. Control your server from Discord with role-based permissions.

## Features

- `/status` shows live server status
- `/map` changes the map
- `/pause` and `/unpause` control the match
- `/restart` restarts the game
- `/exec` runs any RCON command (admin only)
- Role-based access control
- Action logging to a Discord channel

## Tech Stack

- Node.js (ES modules)
- discord.js v14
- rcon-client
- dotenv

## Getting Started

### Prerequisites

- Node.js 18+
- A CS2 server with RCON enabled
- A Discord application with a bot token

### Installation

```bash
git clone https://github.com/<user>/cs2-rcon-bot.git
cd cs2-rcon-bot
npm install
```

### Configuration

Create a `.env` file:

```env
# Discord
DISCORD_TOKEN=your_bot_token
CLIENT_ID=your_application_id
GUILD_ID=your_server_id
DISCORD_LOG_CHANNEL_ID=your_log_channel_id

# CS2 RCON
CS2_RCON_HOST=127.0.0.1
CS2_RCON_PORT=27015
CS2_RCON_PASSWORD=your_rcon_password

# Permissions
ADMIN_ROLE_NAME=Admin
```

### Run

```bash
npm run deploy   # register slash commands
npm start
```
