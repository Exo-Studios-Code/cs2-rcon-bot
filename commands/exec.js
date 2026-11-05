/**
 * Příkaz /exec - Provede libovolný RCON příkaz
 * POUZE pro admin roli - umožňuje plnou kontrolu serveru
 */

import { SlashCommandBuilder } from 'discord.js';
import { getRconInstance } from '../services/rcon.js';
import { Logger } from '../services/logger.js';
import { hasRole, isAdmin } from '../utils/permissions.js';

export const data = new SlashCommandBuilder()
  .setName('exec')
  .setDescription('Provede vlastní RCON příkaz (pouze pro adminy)')
  .addStringOption(option =>
    option
      .setName('prikaz')
      .setDescription('RCON příkaz k provedení')
      .setRequired(true)
  );

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });

  try {
    // Kontrola oprávnění - POUZE admin role nebo Discord admin
    const member = interaction.member;
    const adminRole = process.env.ADMIN_ROLE_NAME || 'CS2 Admin';
    
    if (!hasRole(member, adminRole) && !isAdmin(member)) {
      return await interaction.editReply({
        content: `❌ Nemáš oprávnění použít tento příkaz. Potřebuješ roli **${adminRole}**.`
      });
    }

    // Získej příkaz z parametrů
    const command = interaction.options.getString('prikaz');

    // Bezpečnostní kontrola - zabránit nebezpečným příkazům
    const dangerousCommands = ['quit', 'exit', '_restart'];
    const isCommandDangerous = dangerousCommands.some(cmd => 
      command.toLowerCase().includes(cmd)
    );

    if (isCommandDangerous) {
      return await interaction.editReply({
        content: `⚠️ **Tento příkaz je zakázán z bezpečnostních důvodů.**\nZakázané příkazy: ${dangerousCommands.join(', ')}`
      });
    }

    // Logování akce
    Logger.logCommand(
      interaction.user.id,
      interaction.user.username,
      'exec',
      command
    );

    // Získej RCON instanci
    const rcon = getRconInstance(
      process.env.CS2_RCON_HOST,
      process.env.CS2_RCON_PORT,
      process.env.CS2_RCON_PASSWORD
    );

    // Pošli vlastní RCON příkaz
    const response = await rcon.sendCommand(command);

    // Ořízni příliš dlouhé odpovědi (Discord limit 2000 znaků)
    let displayResponse = response || 'Příkaz proveden (žádná odpověď)';
    if (displayResponse.length > 1800) {
      displayResponse = displayResponse.substring(0, 1800) + '\n... (zkráceno)';
    }

    // Úspěšná odpověď
    await interaction.editReply({
      content: `✅ **Příkaz proveden:** \`${command}\`\n\`\`\`${displayResponse}\`\`\``
    });

  } catch (error) {
    Logger.logError('Exec Command', error);
    
    await interaction.editReply({
      content: `❌ **Chyba při provádění příkazu:**\n\`\`\`${error.message}\`\`\``
    });
  }
}