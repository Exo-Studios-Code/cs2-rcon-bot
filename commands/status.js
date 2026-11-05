/**
 * Příkaz /status - Zobrazí aktuální stav CS2 serveru
 */

import { SlashCommandBuilder } from 'discord.js';
import { getRconInstance } from '../services/rcon.js';
import { Logger } from '../services/logger.js';
import { hasRole, isAdmin } from '../utils/permissions.js';

export const data = new SlashCommandBuilder()
  .setName('status')
  .setDescription('Zobrazí aktuální stav CS2 serveru');

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });

  try {
    // Kontrola oprávnění
    const member = interaction.member;
    const adminRole = process.env.ADMIN_ROLE_NAME || 'CS2 Admin';
    
    if (!hasRole(member, adminRole) && !isAdmin(member)) {
      return await interaction.editReply({
        content: `❌ Nemáš oprávnění použít tento příkaz. Potřebuješ roli **${adminRole}**.`
      });
    }

    // Logování akce
    Logger.logCommand(
      interaction.user.id,
      interaction.user.username,
      'status'
    );

    // Získej RCON instanci
    const rcon = getRconInstance(
      process.env.CS2_RCON_HOST,
      process.env.CS2_RCON_PORT,
      process.env.CS2_RCON_PASSWORD
    );

    // Pošli RCON příkaz pro status
    const response = await rcon.sendCommand('status');

    // Parsuj a formátuj odpověď
    let displayResponse = response || 'Žádné data';
    
    // Ořízni příliš dlouhé odpovědi
    if (displayResponse.length > 1800) {
      displayResponse = displayResponse.substring(0, 1800) + '\n... (zkráceno)';
    }

    // Extrahuj důležité informace (pokud existují)
    const lines = displayResponse.split('\n');
    let hostname = 'N/A';
    let map = 'N/A';
    let players = 'N/A';

    lines.forEach(line => {
      if (line.includes('hostname:')) {
        hostname = line.split('hostname:')[1]?.trim() || hostname;
      }
      if (line.includes('map    :')) {
        map = line.split('map    :')[1]?.trim().split(' ')[0] || map;
      }
      if (line.includes('players :')) {
        players = line.split('players :')[1]?.trim() || players;
      }
    });

    // Úspěšná odpověď s formátovanými daty
    await interaction.editReply({
      content: `📊 **Stav CS2 serveru**\n` +
               `**Hostname:** ${hostname}\n` +
               `**Mapa:** ${map}\n` +
               `**Hráči:** ${players}\n\n` +
               `\`\`\`${displayResponse}\`\`\``
    });

  } catch (error) {
    Logger.logError('Status Command', error);
    
    await interaction.editReply({
      content: `❌ **Chyba při získávání stavu serveru:**\n\`\`\`${error.message}\`\`\`\n\n` +
               `**Možné příčiny:**\n` +
               `• Server je offline\n` +
               `• Špatné RCON heslo\n` +
               `• Nesprávná IP nebo port\n` +
               `• Firewall blokuje připojení`
    });
  }
}