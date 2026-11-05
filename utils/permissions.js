/**
 * Utility pro kontrolu oprávnění uživatelů
 */

/**
 * Zkontroluje, zda má uživatel požadovanou roli
 * @param {GuildMember} member - Discord member objekt
 * @param {string} roleName - Název role k ověření
 * @returns {boolean} True pokud má roli
 */
export function hasRole(member, roleName) {
  if (!member || !member.roles) {
    return false;
  }
  
  // Zkontroluj, zda má uživatel roli podle názvu
  return member.roles.cache.some(role => role.name === roleName);
}

/**
 * Zkontroluje, zda má uživatel admin oprávnění
 * @param {GuildMember} member - Discord member objekt
 * @returns {boolean} True pokud je admin
 */
export function isAdmin(member) {
  if (!member) {
    return false;
  }
  
  // Zkontroluj Discord admin oprávnění
  return member.permissions.has('Administrator');
}