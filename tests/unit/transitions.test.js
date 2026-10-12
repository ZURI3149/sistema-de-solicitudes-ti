/**
 * TEST-U03: Pruebas unitarias para las transiciones de estado y asignación de técnico
 */

import repository, { SolicitudRepository } from '../../src/models/SolicitudRepository.js';

describe('TEST-U03: Validación de transiciones de estado y técnico obligatorio', () => {
  let testRepo;

  beforeEach(() => {
    testRepo = new SolicitudRepository();
  });

  test('Al registrar una solicitud, el estado inicial debe ser Registrada y el técnico null', () => {
    const solicitud = testRepo.create({
      solicitante: 'Alexander Gutierrez',
      categoria: 'Hardware',
      descripcion: 'Teclado dañado',
      prioridad: 'Baja'
    });

    expect(solicitud.estado).toBe('Registrada');
    expect(solicitud.tecnico).toBeNull();
    expect(solicitud.historial).toHaveLength(1);
    expect(solicitud.historial[0].nuevoEstado).toBe('Registrada');
  });

  test('Falla el cambio a "Asignada" si el técnico es nulo o vacío', () => {
    const solicitud = testRepo.create({
      solicitante: 'Alexander Gutierrez',
      categoria: 'Software',
      descripcion: 'Licencia vencida',
      prioridad: 'Media'
    });

    expect(() => {
      testRepo.updateEstado(solicitud.codigo, {
        nuevoEstado: 'Asignada',
        tecnico: null,
        observaciones: 'Asignando ticket'
      });
    }).toThrow('El campo técnico es obligatorio para el estado \'Asignada\'');

    expect(() => {
      testRepo.updateEstado(solicitud.codigo, {
        nuevoEstado: 'Asignada',
        tecnico: '   ',
        observaciones: 'Asignando ticket'
      });
    }).toThrow('El campo técnico es obligatorio para el estado \'Asignada\'');
  });

  test('Permite transición válida a "Asignada" cuando se provee un técnico no vacío', () => {
    const solicitud = testRepo.create({
      solicitante: 'Alexander Gutierrez',
      categoria: 'Software',
      descripcion: 'Licencia vencida',
      prioridad: 'Media'
    });

    const actualizada = testRepo.updateEstado(solicitud.codigo, {
      nuevoEstado: 'Asignada',
      tecnico: 'Carlos Perez',
      observaciones: 'Asignado para atención'
    });

    expect(actualizada.estado).toBe('Asignada');
    expect(actualizada.tecnico).toBe('Carlos Perez');
    expect(actualizada.historial).toHaveLength(2);
    expect(actualizada.historial[1].accion).toBe('ACTUALIZACION_ESTADO');
  });

  test('Falla el cambio a "En Proceso" si no se proporciona técnico', () => {
    const solicitud = testRepo.create({
      solicitante: 'Alexander Gutierrez',
      categoria: 'Hardware',
      descripcion: 'Falla disco duro',
      prioridad: 'Alta'
    });

    testRepo.updateEstado(solicitud.codigo, {
      nuevoEstado: 'Asignada',
      tecnico: 'Carlos Perez'
    });

    expect(() => {
      testRepo.updateEstado(solicitud.codigo, {
        nuevoEstado: 'En Proceso',
        tecnico: '',
        observaciones: 'Iniciando trabajo'
      });
    }).toThrow('El campo técnico es obligatorio para el estado \'En Proceso\'');
  });

  test('Falla el cambio a "Resuelta" si el técnico está vacío', () => {
    const solicitud = testRepo.create({
      solicitante: 'Alexander Gutierrez',
      categoria: 'Redes',
      descripcion: 'Cable desconectado',
      prioridad: 'Media'
    });

    testRepo.updateEstado(solicitud.codigo, {
      nuevoEstado: 'Asignada',
      tecnico: 'Carlos Perez'
    });

    testRepo.updateEstado(solicitud.codigo, {
      nuevoEstado: 'En Proceso',
      tecnico: 'Carlos Perez'
    });

    expect(() => {
      testRepo.updateEstado(solicitud.codigo, {
        nuevoEstado: 'Resuelta',
        tecnico: null,
        observaciones: 'Finalizado'
      });
    }).toThrow('El campo técnico es obligatorio para el estado \'Resuelta\'');
  });

  test('Permite cancelar una solicitud en cualquier estado activo sin requerir técnico', () => {
    const solicitud = testRepo.create({
      solicitante: 'Alexander Gutierrez',
      categoria: 'Hardware',
      descripcion: 'Falsa alarma',
      prioridad: 'Baja'
    });

    const cancelada = testRepo.updateEstado(solicitud.codigo, {
      nuevoEstado: 'Cancelada',
      observaciones: 'Usuario canceló la solicitud'
    });

    expect(cancelada.estado).toBe('Cancelada');
    expect(cancelada.historial).toHaveLength(2);
  });

  test('Rechaza saltos de estado inválidos (ej. Registrada -> Resuelta directamente)', () => {
    const solicitud = testRepo.create({
      solicitante: 'Alexander Gutierrez',
      categoria: 'Redes',
      descripcion: 'Router reiniciado',
      prioridad: 'Media'
    });

    expect(() => {
      testRepo.updateEstado(solicitud.codigo, {
        nuevoEstado: 'Resuelta',
        tecnico: 'Carlos Perez',
        observaciones: 'Salto directo'
      });
    }).toThrow(/No se puede transicionar del estado/);
  });
});
