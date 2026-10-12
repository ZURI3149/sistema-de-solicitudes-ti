/**
 * TEST-A01: Prueba de Aceptación End-to-End del Ciclo de Vida Completo
 * Flujo: Registro -> Consulta -> Asignación -> En Proceso -> Resolución -> Verificación de Auditoría
 */

import request from 'supertest';
import app from '../../src/app.js';
import repository from '../../src/models/SolicitudRepository.js';

describe('TEST-A01: Flujo integral del ciclo de vida de una solicitud', () => {
  beforeEach(() => {
    repository.reset();
  });

  test('Ciclo completo: Registrada -> Asignada -> En Proceso -> Resuelta con verificación de auditoría completa', async () => {
    // Paso 1: Registro de la solicitud (Estado inicial: Registrada, técnico: null)
    const postRes = await request(app)
      .post('/api/solicitudes')
      .send({
        solicitante: 'Alexander Gutierrez',
        categoria: 'Hardware',
        descripcion: 'El equipo no enciende tras descarga eléctrica.',
        prioridad: 'Crítica'
      });

    expect(postRes.status).toBe(201);
    const codigo = postRes.body.codigo;
    expect(codigo).toMatch(/^REQ-[A-Z0-9]{6}$/);
    expect(postRes.body.estado).toBe('Registrada');
    expect(postRes.body.tecnico).toBeNull();
    expect(postRes.body.historial).toHaveLength(1);
    expect(postRes.body.historial[0]).toMatchObject({
      id: 'HST-01',
      accion: 'CREACION',
      estadoAnterior: null,
      nuevoEstado: 'Registrada',
      tecnicoAsignado: null
    });

    // Paso 2: Consulta de la solicitud creada
    const getRes1 = await request(app).get(`/api/solicitudes/${codigo}`);
    expect(getRes1.status).toBe(200);
    expect(getRes1.body.codigo).toBe(codigo);
    expect(getRes1.body.estado).toBe('Registrada');

    // Paso 3: Asignación de técnico (Registrada -> Asignada)
    const patchRes1 = await request(app)
      .patch(`/api/solicitudes/${codigo}/estado`)
      .send({
        nuevoEstado: 'Asignada',
        tecnico: 'Carlos Perez',
        observaciones: 'Asignado al especialista de hardware'
      });

    expect(patchRes1.status).toBe(200);
    expect(patchRes1.body.estado).toBe('Asignada');
    expect(patchRes1.body.tecnico).toBe('Carlos Perez');
    expect(patchRes1.body.historial).toHaveLength(2);
    expect(patchRes1.body.historial[1]).toMatchObject({
      id: 'HST-02',
      accion: 'ACTUALIZACION_ESTADO',
      estadoAnterior: 'Registrada',
      nuevoEstado: 'Asignada',
      tecnicoAsignado: 'Carlos Perez',
      observaciones: 'Asignado al especialista de hardware'
    });

    // Paso 4: Inicio de labores técnicas (Asignada -> En Proceso)
    const patchRes2 = await request(app)
      .patch(`/api/solicitudes/${codigo}/estado`)
      .send({
        nuevoEstado: 'En Proceso',
        tecnico: 'Carlos Perez',
        observaciones: 'Iniciando diagnóstico en banco de pruebas'
      });

    expect(patchRes2.status).toBe(200);
    expect(patchRes2.body.estado).toBe('En Proceso');
    expect(patchRes2.body.tecnico).toBe('Carlos Perez');
    expect(patchRes2.body.historial).toHaveLength(3);
    expect(patchRes2.body.historial[2]).toMatchObject({
      id: 'HST-03',
      accion: 'ACTUALIZACION_ESTADO',
      estadoAnterior: 'Asignada',
      nuevoEstado: 'En Proceso',
      tecnicoAsignado: 'Carlos Perez'
    });

    // Paso 5: Resolución de la solicitud (En Proceso -> Resuelta)
    const patchRes3 = await request(app)
      .patch(`/api/solicitudes/${codigo}/estado`)
      .send({
        nuevoEstado: 'Resuelta',
        tecnico: 'Carlos Perez',
        observaciones: 'Fuente de poder reemplazada y pruebas operativas superadas con éxito'
      });

    expect(patchRes3.status).toBe(200);
    expect(patchRes3.body.estado).toBe('Resuelta');
    expect(patchRes3.body.tecnico).toBe('Carlos Perez');
    expect(patchRes3.body.historial).toHaveLength(4);
    expect(patchRes3.body.historial[3]).toMatchObject({
      id: 'HST-04',
      accion: 'ACTUALIZACION_ESTADO',
      estadoAnterior: 'En Proceso',
      nuevoEstado: 'Resuelta',
      tecnicoAsignado: 'Carlos Perez',
      observaciones: 'Fuente de poder reemplazada y pruebas operativas superadas con éxito'
    });

    // Paso 6: Verificación de auditoría final completa e integridad de fechas
    const getResFinal = await request(app).get(`/api/solicitudes/${codigo}`);
    expect(getResFinal.status).toBe(200);
    const finalData = getResFinal.body;

    expect(finalData.estado).toBe('Resuelta');
    expect(finalData.tecnico).toBe('Carlos Perez');
    expect(finalData.historial).toHaveLength(4);
    expect(new Date(finalData.fechaActualizacion).getTime()).toBeGreaterThanOrEqual(
      new Date(finalData.fechaCreacion).getTime()
    );

    // Comprobar secuencia cronológica de los 4 registros de historial
    const estadosSecuencia = finalData.historial.map(h => h.nuevoEstado);
    expect(estadosSecuencia).toEqual(['Registrada', 'Asignada', 'En Proceso', 'Resuelta']);
  });
});
