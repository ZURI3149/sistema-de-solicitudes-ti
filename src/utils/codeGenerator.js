/**
 * Generador de códigos únicos de solicitud en formato REQ-[A-Z0-9]{6}
 */

const ALPHANUMERIC_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const CODE_PREFIX = 'REQ-';
const CODE_LENGTH = 6;

/**
 * Genera una cadena alfanumérica aleatoria de longitud especificada
 * @param {number} length
 * @returns {string}
 */
export function generateRandomAlphanumeric(length = CODE_LENGTH) {
  let result = '';
  const charsLength = ALPHANUMERIC_CHARS.length;
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charsLength);
    result += ALPHANUMERIC_CHARS.charAt(randomIndex);
  }
  return result;
}

/**
 * Genera un código de solicitud en formato REQ-[A-Z0-9]{6}
 * @param {Function} [isUniqueFn] - Función opcional para validar unicidad
 * @returns {string}
 */
export function generateTicketCode(isUniqueFn) {
  let code = '';
  let attempts = 0;
  const maxAttempts = 1000;

  do {
    const randomPart = generateRandomAlphanumeric(CODE_LENGTH);
    code = `${CODE_PREFIX}${randomPart}`;
    attempts++;
    if (attempts > maxAttempts) {
      throw new Error('No se pudo generar un código único después de múltiples intentos');
    }
  } while (typeof isUniqueFn === 'function' && !isUniqueFn(code));

  return code;
}

export default {
  generateRandomAlphanumeric,
  generateTicketCode,
};
