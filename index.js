/**
 * CS2 RCON Discord Bot - Hlavní soubor
 * Bot pro ovládání CS2 serveru pomocí RCON protokolu přes Discord
 */

import { Client, Collection, Events, GatewayIntentBits } from 'discord.js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdirSync } from 'fs';
import { Logger } from './services/logger.js';

// Načti .env konfiguraci
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Validace ENV proměnných
const requiredEnvVars = [
  'DISCORD_TOKEN',
  'CLIENT_ID',
  'GUILD_ID',
  'CS2_RCON_HOST',
  'CS2_RCON_PORT',
  'CS2_RCON_PASSWORD'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('❌ Chybějící ENV proměnné:');
  missingVars.forEach(varName => console.error(`   • ${varName}`));
  console.error('\n💡 Zkontroluj soubor .env');
  process.exit(1);
}

// Vytvoř Discord klienta
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

// Inicializuj Logger s Discord clientem
Logger.init(client);

// Collection pro ukládání commandů
client.commands = new Collection();

// Načti všechny command soubory
const commandsPath = join(__dirname, 'commands');
const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));

Logger.logInfo('Načítám příkazy...');

for (const file of commandFiles) {
  const filePath = join(commandsPath, file);
  const command = await import(`file://${filePath}`);
  
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
    Logger.logInfo(`  ✔ Načten příkaz: ${command.data.name}`);
  } else {
    Logger.logError('Command Load', new Error(`Soubor ${file} nemá required 'data' nebo 'execute' export`));
  }
}

// Event: Bot je připraven
client.once(Events.ClientReady, readyClient => {
  Logger.logInfo(`✅ Bot přihlášen jako ${readyClient.user.tag}`);
  Logger.logInfo(`🎮 RCON server: ${process.env.CS2_RCON_HOST}:${process.env.CS2_RCON_PORT}`);
  Logger.logInfo(`🔒 Admin role: ${process.env.ADMIN_ROLE_NAME || 'CS2 Admin'}`);
  Logger.logInfo(`📊 Načteno ${client.commands.size} příkazů`);
  
  // Nastav status bota
  client.user.setActivity('CS2 Server', { type: 'WATCHING' });
});

// Event: Příjem slash commandu
client.on(Events.InteractionCreate, async interaction => {
  // Autocomplete pro /map příkaz
  if (interaction.isAutocomplete()) {
    const command = client.commands.get(interaction.commandName);
    
    if (!command || !command.autocomplete) {
      return;
    }

    try {
      await command.autocomplete(interaction);
    } catch (error) {
      Logger.logError('Autocomplete', error);
    }
    return;
  }

  // Slash command
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    Logger.logError('Command Not Found', new Error(`Příkaz ${interaction.commandName} neexistuje`));
    return;
  }

  try {
    // Loguj provedení příkazu
    const params = interaction.options.data
      .map(opt => `${opt.name}=${opt.value}`)
      .join(', ');
    
    Logger.logCommand(
      interaction.user.id,
      interaction.user.tag,
      interaction.commandName,
      params
    );

    await command.execute(interaction);
  } catch (error) {
    Logger.logError(`Command Execution: ${interaction.commandName}`, error);
    
    // Pokud interakce ještě nebyla zodpovězena
    if (interaction.deferred && !interaction.replied) {
      await interaction.editReply({
        content: '❌ Došlo k chybě při provádění příkazu.',
      });
    } else if (!interaction.replied) {
      await interaction.reply({
        content: '❌ Došlo k chybě při provádění příkazu.',
        ephemeral: true
      });
    }
  }
});

// Event: Chyba
client.on(Events.Error, error => {
  Logger.logError('Discord Client', error);
});

// Event: Warning
client.on(Events.Warn, info => {
  console.warn(`⚠️ ${info}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  Logger.logInfo('🛑 Vypínám bota...');
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  Logger.logInfo('🛑 Vypínám bota...');
  client.destroy();
  process.exit(0);
});

// Ošetření neošetřených chyb
process.on('unhandledRejection', error => {
  Logger.logError('Unhandled Rejection', error);
});

process.on('uncaughtException', error => {
  Logger.logError('Uncaught Exception', error);
  process.exit(1);
});

// Přihlaš bota
Logger.logInfo('🚀 Startuji bota...');
client.login(process.env.DISCORD_TOKEN);