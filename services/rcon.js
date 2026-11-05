/**
 * RCON služba pro komunikaci s CS2 serverem
 * Používá rcon-client pro spolehlivé připojení
 */

import { Rcon } from 'rcon-client';
import { Logger } from './logger.js';

export class RconService {
  constructor(host, port, password) {
    this.host = host;
    this.port = parseInt(port);
    this.password = password;
    this.client = null;
    this.isConnected = false;
  }

  /**
   * Připojení k RCON serveru
   * @returns {Promise<boolean>} True pokud úspěšné
   */
  async connect() {
    try {
      // Pokud už je připojeno, vrať true
      if (this.isConnected && this.client) {
        return true;
      }

      // Vytvoř nového RCON klienta
      this.client = await Rcon.connect({
        host: this.host,
        port: this.port,
        password: this.password,
        timeout: 5000 // 5 sekund timeout
      });

      this.isConnected = true;
      Logger.logInfo(`RCON připojeno k ${this.host}:${this.port}`);
      
      return true;
    } catch (error) {
      this.isConnected = false;
      Logger.logError('RCON Connect', error);
      throw new Error(`Nelze se připojit k serveru: ${error.message}`);
    }
  }

  /**
   * Odpojení od RCON serveru
   */
  async disconnect() {
    try {
      if (this.client) {
        await this.client.end();
        this.client = null;
        this.isConnected = false;
        Logger.logInfo('RCON odpojeno');
      }
    } catch (error) {
      Logger.logError('RCON Disconnect', error);
    }
  }

  /**
   * Pošle RCON příkaz na server
   * @param {string} command - RCON příkaz k provedení
   * @returns {Promise<string>} Odpověď ze serveru
   */
  async sendCommand(command) {
    try {
      // Ujisti se, že jsme připojeni
      if (!this.isConnected || !this.client) {
        await this.connect();
      }

      // Pošli příkaz
      const response = await this.client.send(command);
      Logger.logRconSuccess(command, response);
      
      return response;
    } catch (error) {
      Logger.logError(`RCON Command: ${command}`, error);
      
      // Pokus o reconnect při chybě
      this.isConnected = false;
      
      // Vrať user-friendly chybovou zprávu
      if (error.message.includes('timeout')) {
        throw new Error('Server neodpovídá (timeout). Je server online?');
      } else if (error.message.includes('authentication')) {
        throw new Error('Špatné RCON heslo.');
      } else if (error.message.includes('ECONNREFUSED')) {
        throw new Error('Server odmítl připojení. Zkontroluj IP a port.');
      } else {
        throw new Error(`RCON chyba: ${error.message}`);
      }
    }
  }

  /**
   * Testuje připojení k serveru
   * @returns {Promise<boolean>} True pokud server odpovídá
   */
  async testConnection() {
    try {
      await this.connect();
      await this.sendCommand('status');
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Globální instance RCON služby
let rconInstance = null;

/**
 * Vrátí nebo vytvoří RCON instanci
 * @param {string} host 
 * @param {string} port 
 * @param {string} password 
 * @returns {RconService}
 */
export function getRconInstance(host, port, password) {
  if (!rconInstance) {
    rconInstance = new RconService(host, port, password);
  }
  return rconInstance;
}