/**
 * TEST-U01: Pruebas unitarias para la validación de payloads de registro
 */

import { jest } from '@jest/globals';
import { validateCrearSolicitud } from '../../src/middlewares/validator.js';

describe('TEST-U01: Validación de payload al registrar solicitud', () => {
  let mockReq;
  let mockRes;
  let nextFn;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    nextFn = jest.fn();
  });

  test('Debe llamar a next() cuando todos los datos son válidos', () => {
    mockReq = {
      body: {
        solicitante: 'Alexander Gutierrez',
        categoria: 'Hardware',
        descripcion: 'El monitor parpadea al encender',
        prioridad: 'Alta'
      }
    };

    validateCrearSolicitud(mockReq, mockRes, nextFn);

    expect(nextFn).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  test('Debe fallar con 400 y mensaje descriptivo si falta un campo obligatorio (solicitante)', () => {
    mockReq = {
      body: {
        categoria: 'Hardware',
        descripcion: 'Problema con impresora',
        prioridad: 'Media'
      }
    };

    validateCrearSolicitud(mockReq, mockRes, nextFn);

    expect(nextFn).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'BAD_REQUEST',
        mensaje: expect.stringContaining('Todos los campos son obligatorios'),
        detalles: expect.arrayContaining([expect.stringContaining('solicitante')])
      })
    );
  });

  test('Debe fallar con 400 si un campo contiene únicamente espacios en blanco', () => {
    mockReq = {
      body: {
        solicitante: '   ',
        categoria: 'Hardware',
        descripcion: '   ',
        prioridad: 'Media'
      }
    };

    validateCrearSolicitud(mockReq, mockRes, nextFn);

    expect(nextFn).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  test('Debe fallar con 400 si la categoría no pertenece al catálogo permitido', () => {
    mockReq = {
      body: {
        solicitante: 'Carlos Gomez',
        categoria: 'InvalidaCategoria',
        descripcion: 'Falla general',
        prioridad: 'Alta'
      }
    };

    validateCrearSolicitud(mockReq, mockRes, nextFn);

    expect(nextFn).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'BAD_REQUEST',
        detalles: expect.arrayContaining([expect.stringContaining('categoria')])
      })
    );
  });

  test('Debe fallar con 400 si la prioridad no pertenece al catálogo permitido', () => {
    mockReq = {
      body: {
        solicitante: 'Carlos Gomez',
        categoria: 'Software',
        descripcion: 'Falla en Windows',
        prioridad: 'SuperUrgente'
      }
    };

    validateCrearSolicitud(mockReq, mockRes, nextFn);

    expect(nextFn).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'BAD_REQUEST',
        detalles: expect.arrayContaining([expect.stringContaining('prioridad')])
      })
    );
  });

  test('Debe rechazar la asignación de técnico durante el registro inicial', () => {
    mockReq = {
      body: {
        solicitante: 'Laura Diaz',
        categoria: 'Redes',
        descripcion: 'Sin acceso a internet',
        prioridad: 'Crítica',
        tecnico: 'Juan Perez'
      }
    };

    validateCrearSolicitud(mockReq, mockRes, nextFn);

    expect(nextFn).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'BAD_REQUEST',
        detalles: expect.arrayContaining([expect.stringContaining('No se permite asignar técnico')])
      })
    );
  });
});
