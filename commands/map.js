/**
 * Příkaz /map - Změní mapu na CS2 serveru
 */

import { SlashCommandBuilder } from 'discord.js';
import { getRconInstance } from '../services/rcon.js';
import { Logger } from '../services/logger.js';
import { hasRole, isAdmin } from '../utils/permissions.js';

// Seznam populárních CS2 map pro autocomplete
const POPULAR_MAPS = [
  'de_mirage',
  'de_dust2',
  'de_inferno',
  'de_nuke',
  'de_overpass',
  'de_vertigo',
  'de_ancient',
  'de_anubis',
  'cs_office',
  'cs_italy'
];

export const data = new SlashCommandBuilder()
  .setName('map')
  .setDescription('Změní mapu na CS2 serveru')
  .addStringOption(option =>
    option
      .setName('mapa')
      .setDescription('Název mapy (např. de_mirage, de_dust2)')
      .setRequired(true)
      .setAutocomplete(true)
  );

export async function autocomplete(interaction) {
  const focusedValue = interaction.options.getFocused().toLowerCase();
  
  // Filtruj mapy podle toho, co uživatel píše
  const filtered = POPULAR_MAPS.filter(map => 
    map.toLowerCase().includes(focusedValue)
  );
  
  // Vrať max 25 výsledků (Discord limit)
  await interaction.respond(
    filtered.slice(0, 25).map(map => ({ name: map, value: map }))
  );
}

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

    // Získej parametr mapy
    const mapName = interaction.options.getString('mapa');

    // Logování akce
    Logger.logCommand(
      interaction.user.id,
      interaction.user.username,
      'map',
      mapName
    );

    // Získej RCON instanci
    const rcon = getRconInstance(
      process.env.CS2_RCON_HOST,
      process.env.CS2_RCON_PORT,
      process.env.CS2_RCON_PASSWORD
    );

    // Pošli RCON příkaz pro změnu mapy
    const response = await rcon.sendCommand(`changelevel ${mapName}`);

    // Úspěšná odpověď
    await interaction.editReply({
      content: `✅ **Mapa se mění na: ${mapName}**\n\`\`\`${response || 'Server se restartuje...'}\`\`\``
    });

  } catch (error) {
    Logger.logError('Map Command', error);
    
    await interaction.editReply({
      content: `❌ **Chyba při změně mapy:**\n\`\`\`${error.message}\`\`\``
    });
  }
}