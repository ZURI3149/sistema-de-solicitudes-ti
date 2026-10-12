/**
 * TEST-I01 y TEST-I02: Pruebas de integración para endpoints de solicitudes
 */

import request from 'supertest';
import app from '../../src/app.js';
import repository from '../../src/models/SolicitudRepository.js';

describe('Pruebas de Integración - API Solicitudes', () => {
  beforeEach(() => {
    repository.reset();
  });

  describe('TEST-I01: Flujo de persistencia y consulta', () => {
    test('Debe registrar una solicitud vía POST y recuperarla íntegramente vía GET por código', async () => {
      const payload = {
        solicitante: 'Alexander Gutierrez',
        categoria: 'Hardware',
        descripcion: 'El monitor no enciende tras reinicio del sistema.',
        prioridad: 'Alta'
      };

      // 1. Registro vía POST /api/solicitudes
      const postRes = await request(app)
        .post('/api/solicitudes')
        .send(payload);

      expect(postRes.status).toBe(201);
      expect(postRes.body).toHaveProperty('codigo');
      expect(postRes.body.codigo).toMatch(/^REQ-[A-Z0-9]{6}$/);
      expect(postRes.body.solicitante).toBe(payload.solicitante);
      expect(postRes.body.categoria).toBe(payload.categoria);
      expect(postRes.body.descripcion).toBe(payload.descripcion);
      expect(postRes.body.prioridad).toBe(payload.prioridad);
      expect(postRes.body.estado).toBe('Registrada');
      expect(postRes.body.tecnico).toBeNull();
      expect(postRes.body.historial).toHaveLength(1);

      const codigoGenerado = postRes.body.codigo;

      // 2. Consulta vía GET /api/solicitudes/:codigo
      const getRes = await request(app)
        .get(`/api/solicitudes/${codigoGenerado}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.codigo).toBe(codigoGenerado);
      expect(getRes.body.solicitante).toBe(payload.solicitante);
      expect(getRes.body.categoria).toBe(payload.categoria);
      expect(getRes.body.descripcion).toBe(payload.descripcion);
      expect(getRes.body.prioridad).toBe(payload.prioridad);
      expect(getRes.body.estado).toBe('Registrada');
      expect(getRes.body.tecnico).toBeNull();
      expect(getRes.body.historial).toHaveLength(1);
    });

    test('Debe permitir consulta insensible a mayúsculas/minúsculas y espacios circundantes', async () => {
      const postRes = await request(app)
        .post('/api/solicitudes')
        .send({
          solicitante: 'Alexander Gutierrez',
          categoria: 'Software',
          descripcion: 'Error en base de datos',
          prioridad: 'Crítica'
        });

      const codigo = postRes.body.codigo;
      const codigoConMinusculasYEspacios = `  ${codigo.toLowerCase()}  `;

      const getRes = await request(app)
        .get(`/api/solicitudes/${codigoConMinusculasYEspacios}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.codigo).toBe(codigo);
    });
  });

  describe('TEST-I02: Actualización de estado y auditoría', () => {
    test('Debe actualizar el estado a Asignada y verificar que el historial incremente su longitud', async () => {
      // 1. Crear solicitud inicial
      const postRes = await request(app)
        .post('/api/solicitudes')
        .send({
          solicitante: 'Alexander Gutierrez',
          categoria: 'Redes',
          descripcion: 'Latencia elevada en el switch principal',
          prioridad: 'Media'
        });

      const codigo = postRes.body.codigo;
      expect(postRes.body.historial).toHaveLength(1);

      // 2. Transición a Asignada con técnico
      const patchRes = await request(app)
        .patch(`/api/solicitudes/${codigo}/estado`)
        .send({
          nuevoEstado: 'Asignada',
          tecnico: 'Carlos Perez',
          observaciones: 'Asignado para revisión en sitio'
        });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.estado).toBe('Asignada');
      expect(patchRes.body.tecnico).toBe('Carlos Perez');
      expect(patchRes.body.historial).toHaveLength(2);

      const segundoHistorial = patchRes.body.historial[1];
      expect(segundoHistorial.id).toBe('HST-02');
      expect(segundoHistorial.accion).toBe('ACTUALIZACION_ESTADO');
      expect(segundoHistorial.estadoAnterior).toBe('Registrada');
      expect(segundoHistorial.nuevoEstado).toBe('Asignada');
      expect(segundoHistorial.tecnicoAsignado).toBe('Carlos Perez');
      expect(segundoHistorial.observaciones).toBe('Asignado para revisión en sitio');
    });
  });
});
