/**
 * TEST-U02: Pruebas unitarias para el generador de código de solicitudes
 */

import { generateRandomAlphanumeric, generateTicketCode } from '../../src/utils/codeGenerator.js';

describe('TEST-U02: Generador de códigos alfanuméricos únicos', () => {
  test('Debe generar un código con el formato exacto REQ-[A-Z0-9]{6}', () => {
    const code = generateTicketCode();
    expect(code).toMatch(/^REQ-[A-Z0-9]{6}$/);
  });

  test('Debe generar cadenas aleatorias de longitud fija', () => {
    const part = generateRandomAlphanumeric(6);
    expect(part).toHaveLength(6);
    expect(part).toMatch(/^[A-Z0-9]{6}$/);
  });

  test('Debe generar 1000 iteraciones consecutivas sin colisiones ni duplicados', () => {
    const set = new Set();
    const iterations = 1000;

    for (let i = 0; i < iterations; i++) {
      const code = generateTicketCode((candidate) => !set.has(candidate));
      expect(code).toMatch(/^REQ-[A-Z0-9]{6}$/);
      expect(set.has(code)).toBe(false);
      set.add(code);
    }

    expect(set.size).toBe(iterations);
  });
});
