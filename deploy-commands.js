/**
 * Skript pro registraci slash commandů na Discord serveru
 * Spusť tento skript jednou před prvním spuštěním bota
 */

import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdirSync } from 'fs';

// Načti .env
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const commands = [];

// Načti všechny command soubory
const commandsPath = join(__dirname, 'commands');
const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));

console.log('📦 Načítám příkazy...');

for (const file of commandFiles) {
  const filePath = join(commandsPath, file);
  const command = await import(`file://${filePath}`);
  
  if ('data' in command && 'execute' in command) {
    commands.push(command.data.toJSON());
    console.log(`   ✓ ${command.data.name}`);
  } else {
    console.log(`   ⚠ Soubor ${file} nemá required 'data' nebo 'execute' export`);
  }
}

// Vytvoř REST instanci
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

// Registruj příkazy
(async () => {
  try {
    console.log(`\n🚀 Začínám registraci ${commands.length} slash commandů...`);

    // Guild-specific (rychlejší pro testování)
    const data = await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands },
    );

    console.log(`✅ Úspěšně zaregistrováno ${data.length} slash commandů!`);
    console.log('\n📋 Zaregistrované příkazy:');
    data.forEach(cmd => {
      console.log(`   • /${cmd.name} - ${cmd.description}`);
    });
    
    console.log('\n✨ Můžeš nyní spustit bota pomocí: npm start');

  } catch (error) {
    console.error('❌ Chyba při registraci příkazů:', error);
    
    if (error.code === 50001) {
      console.log('\n⚠️  Bot nemá přístup k serveru. Ujisti se, že:');
      console.log('   1. Bot je přidán na Discord server');
      console.log('   2. GUILD_ID v .env je správné');
    } else if (error.code === 'TokenInvalid') {
      console.log('\n⚠️  Neplatný Discord token. Zkontroluj DISCORD_TOKEN v .env');
    }
  }
})();