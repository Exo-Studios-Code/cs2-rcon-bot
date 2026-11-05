import { EmbedBuilder } from 'discord.js';

/**
 * Logger služba pro logování akcí a chyb
 * Loguje do konzole s timestampem a do Discord kanálu
 */
export class Logger {
  static client = null;
  static logChannelId = null;
  static isReady = false;

  /**
   * Inicializuje logger s Discord clientem
   * @param {Client} discordClient - Discord.js client
   */
  static init(discordClient) {
    this.client = discordClient;
    this.logChannelId = process.env.DISCORD_LOG_CHANNEL_ID;
    
    // Počkej na clientReady event
    if (this.client.isReady()) {
      this.isReady = true;
      if (this.logChannelId) {
        console.log(`[LOGGER] Discord logging enabled to channel: ${this.logChannelId}`);
      } else {
        console.log('[LOGGER] Discord logging disabled - DISCORD_LOG_CHANNEL_ID not set');
      }
    } else {
      this.client.once('clientReady', () => {
        this.isReady = true;
        if (this.logChannelId) {
          console.log(`[LOGGER] Discord logging enabled to channel: ${this.logChannelId}`);
        } else {
          console.log('[LOGGER] Discord logging disabled - DISCORD_LOG_CHANNEL_ID not set');
        }
      });
    }
  }

  /**
   * Odešle log do Discord kanálu
   * @param {EmbedBuilder} embed - Discord embed
   */
  static async sendToDiscord(embed) {
    if (!this.client || !this.logChannelId || !this.isReady) return;

    try {
      const channel = await this.client.channels.fetch(this.logChannelId);
      if (channel && channel.isTextBased()) {
        await channel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error('[LOGGER] Failed to send log to Discord:', error.message);
    }
  }

  /**
   * Loguje akci uživatele
   * @param {string} userId - Discord ID uživatele
   * @param {string} username - Discord username
   * @param {string} command - Název příkazu
   * @param {string} params - Parametry příkazu
   */
  static logCommand(userId, username, command, params = '') {
    const timestamp = new Date().toISOString();
    const paramsStr = params ? ` | Params: ${params}` : '';
    console.log(`[${timestamp}] USER: ${username} (${userId}) | CMD: ${command}${paramsStr}`);

    // Discord embed
    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle('📝 Command Executed')
      .addFields(
        { name: 'User', value: `${username} (${userId})`, inline: true },
        { name: 'Command', value: command, inline: true }
      )
      .setTimestamp();

    if (params) {
      embed.addFields({ name: 'Parameters', value: params, inline: false });
    }

    this.sendToDiscord(embed);
  }

  /**
   * Loguje chybu
   * @param {string} context - Kontext chyby
   * @param {Error} error - Chybový objekt
   */
  static logError(context, error) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ERROR in ${context}:`, error.message);
    if (error.stack) {
      console.error(error.stack);
    }

    // Discord embed
    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle('❌ Error Occurred')
      .addFields(
        { name: 'Context', value: context, inline: false },
        { name: 'Error', value: error.message.substring(0, 1024), inline: false }
      )
      .setTimestamp();

    if (error.stack) {
      const stackPreview = error.stack.substring(0, 1024);
      embed.addFields({ name: 'Stack Trace', value: `\`\`\`${stackPreview}\`\`\``, inline: false });
    }

    this.sendToDiscord(embed);
  }

  /**
   * Loguje informaci
   * @param {string} message - Zpráva k logu
   */
  static logInfo(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] INFO: ${message}`);

    // Discord embed
    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle('ℹ️ Information')
      .setDescription(message.substring(0, 4096))
      .setTimestamp();

    this.sendToDiscord(embed);
  }

  /**
   * Loguje úspěšnou RCON operaci
   * @param {string} command - RCON příkaz
   * @param {string} response - Odpověď serveru
   */
  static logRconSuccess(command, response) {
    const timestamp = new Date().toISOString();
    const responsePreview = response.substring(0, 100);
    console.log(`[${timestamp}] RCON SUCCESS: ${command}`);
    console.log(`Response: ${responsePreview}${response.length > 100 ? '...' : ''}`);

    // Discord embed
    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle('✅ RCON Success')
      .addFields(
        { name: 'Command', value: `\`${command}\``, inline: false },
        { name: 'Response', value: responsePreview.substring(0, 1024) + (response.length > 100 ? '...' : ''), inline: false }
      )
      .setTimestamp();

    this.sendToDiscord(embed);
  }
}