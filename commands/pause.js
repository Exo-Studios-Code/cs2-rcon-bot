/**
 * Příkaz /pause - Pozastaví CS2 zápas
 */

import { SlashCommandBuilder } from 'discord.js';
import { getRconInstance } from '../services/rcon.js';
import { Logger } from '../services/logger.js';
import { hasRole, isAdmin } from '../utils/permissions.js';

export const data = new SlashCommandBuilder()
  .setName('pause')
  .setDescription('Pozastaví CS2 zápas');

export async function execute(interaction) {
  // Defer reply - dáme botovi čas na zpracování
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
      'pause'
    );

    // Získej RCON instanci
    const rcon = getRconInstance(
      process.env.CS2_RCON_HOST,
      process.env.CS2_RCON_PORT,
      process.env.CS2_RCON_PASSWORD
    );

    // Pošli RCON příkaz
    const response = await rcon.sendCommand('mp_pause_match');

    // Úspěšná odpověď
    await interaction.editReply({
      content: `✅ **Zápas pozastaven**\n\`\`\`${response || 'Příkaz proveden'}\`\`\``
    });

  } catch (error) {
    Logger.logError('Pause Command', error);
    
    await interaction.editReply({
      content: `❌ **Chyba při pozastavování zápasu:**\n\`\`\`${error.message}\`\`\``
    });
  }
}