/**
 * TEST-E01 y TEST-E02: Pruebas de casos de error y respuestas negativas
 */

import request from 'supertest';
import app from '../../src/app.js';
import repository from '../../src/models/SolicitudRepository.js';

describe('Pruebas de Casos Negativos y Manejo de Errores', () => {
  beforeEach(() => {
    repository.reset();
  });

  describe('TEST-E01: Registro con datos incompletos o inválidos', () => {
    test('Responde 400 Bad Request cuando faltan campos obligatorios', async () => {
      const res = await request(app)
        .post('/api/solicitudes')
        .send({
          solicitante: '',
          categoria: 'Hardware'
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'BAD_REQUEST');
      expect(res.body).toHaveProperty('mensaje');
      expect(res.body.mensaje).toContain('Todos los campos son obligatorios');
      expect(Array.isArray(res.body.detalles)).toBe(true);
    });

    test('Responde 400 Bad Request cuando la categoría no es válida', async () => {
      const res = await request(app)
        .post('/api/solicitudes')
        .send({
          solicitante: 'Alexander Gutierrez',
          categoria: 'Inexistente',
          descripcion: 'Falla en terminal',
          prioridad: 'Alta'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('BAD_REQUEST');
      expect(res.body.detalles.some(d => d.includes('categoria'))).toBe(true);
    });
  });

  describe('TEST-E02: Consulta con código inexistente', () => {
    test('Responde 404 Not Found al buscar un código no registrado', async () => {
      const codigoInexistente = 'REQ-INEXISTENTE';
      const res = await request(app)
        .get(`/api/solicitudes/${codigoInexistente}`);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'NOT_FOUND');
      expect(res.body.mensaje).toBe(`No se encontró ninguna solicitud con el código ${codigoInexistente}`);
    });

    test('Responde 404 Not Found al intentar actualizar el estado de un código no registrado', async () => {
      const res = await request(app)
        .patch('/api/solicitudes/REQ-NONEXIST/estado')
        .send({
          nuevoEstado: 'Asignada',
          tecnico: 'Carlos Perez'
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('NOT_FOUND');
    });
  });
});
