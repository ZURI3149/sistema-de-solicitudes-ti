/**
 * Repositorio de Solicitudes en Memoria (Singleton)
 * Encapsula la persistencia, validaciones de catálogo, transiciones y auditoría.
 */

import { generateTicketCode } from '../utils/codeGenerator.js';

export const CATEGORIAS_PERMITIDAS = Object.freeze(['Hardware', 'Software', 'Redes']);
export const PRIORIDADES_PERMITIDAS = Object.freeze(['Baja', 'Media', 'Alta', 'Crítica']);
export const ESTADOS_PERMITIDOS = Object.freeze(['Registrada', 'Asignada', 'En Proceso', 'Resuelta', 'Cancelada']);

// Transiciones de estado permitidas
export const TRANSICIONES_VALIDAS = Object.freeze({
  'Registrada': ['Asignada', 'Cancelada'],
  'Asignada': ['En Proceso', 'Cancelada'],
  'En Proceso': ['Resuelta', 'Cancelada'],
  'Resuelta': [], // Estado final
  'Cancelada': [] // Estado final
});

// Estados que requieren obligatoriamente un técnico asignado
export const ESTADOS_REQUIEREN_TECNICO = Object.freeze(['Asignada', 'En Proceso', 'Resuelta']);

export class SolicitudRepository {
  constructor() {
    this.solicitudes = new Map();
  }

  /**
   * Limpia todas las solicitudes almacenadas (utilizado entre suites de prueba)
   */
  reset() {
    this.solicitudes.clear();
  }

  /**
   * Retorna todas las solicitudes registradas
   * @returns {Array}
   */
  findAll() {
    return Array.from(this.solicitudes.values()).map(s => JSON.parse(JSON.stringify(s)));
  }

  /**
   * Busca una solicitud por su código alfanumérico
   * @param {string} codigo
   * @returns {Object|null}
   */
  findByCodigo(codigo) {
    if (!codigo || typeof codigo !== 'string') return null;
    const normalized = codigo.trim().toUpperCase();
    const solicitud = this.solicitudes.get(normalized);
    if (!solicitud) return null;
    return JSON.parse(JSON.stringify(solicitud));
  }

  /**
   * Verifica si un código ya existe en el repositorio
   * @param {string} codigo
   * @returns {boolean}
   */
  existsCodigo(codigo) {
    if (!codigo || typeof codigo !== 'string') return false;
    return this.solicitudes.has(codigo.trim().toUpperCase());
  }

  /**
   * Registra una nueva solicitud en el repositorio
   * @param {Object} data
   * @param {string} data.solicitante
   * @param {string} data.categoria
   * @param {string} data.descripcion
   * @param {string} data.prioridad
   * @returns {Object} Solicitud creada
   */
  create({ solicitante, categoria, descripcion, prioridad }) {
    const codigo = generateTicketCode((candidate) => !this.solicitudes.has(candidate));
    const now = new Date().toISOString();

    const primerHistorial = {
      id: 'HST-01',
      fechaHora: now,
      accion: 'CREACION',
      estadoAnterior: null,
      nuevoEstado: 'Registrada',
      tecnicoAsignado: null,
      observaciones: 'Registro inicial de la solicitud'
    };

    const nuevaSolicitud = {
      codigo,
      solicitante: solicitante.trim(),
      categoria: categoria.trim(),
      descripcion: descripcion.trim(),
      prioridad: prioridad.trim(),
      estado: 'Registrada',
      tecnico: null,
      fechaCreacion: now,
      fechaActualizacion: now,
      historial: [primerHistorial]
    };

    this.solicitudes.set(codigo, nuevaSolicitud);
    return JSON.parse(JSON.stringify(nuevaSolicitud));
  }

  /**
   * Actualiza el estado y el técnico de una solicitud existente
   * @param {string} codigo
   * @param {Object} updateData
   * @param {string} updateData.nuevoEstado
   * @param {string} [updateData.tecnico]
   * @param {string} [updateData.observaciones]
   * @returns {Object} Solicitud actualizada
   */
  updateEstado(codigo, { nuevoEstado, tecnico, observaciones }) {
    const normalized = codigo ? codigo.trim().toUpperCase() : '';
    const solicitud = this.solicitudes.get(normalized);

    if (!solicitud) {
      const err = new Error(`No se encontró ninguna solicitud con el código ${codigo}`);
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    if (!ESTADOS_PERMITIDOS.includes(nuevoEstado)) {
      const err = new Error(`El estado '${nuevoEstado}' no es válido. Estados permitidos: ${ESTADOS_PERMITIDOS.join(', ')}`);
      err.statusCode = 400;
      err.code = 'BAD_REQUEST';
      throw err;
    }

    // Validación de transición válida
    const estadosPosibles = TRANSICIONES_VALIDAS[solicitud.estado] || [];
    if (!estadosPosibles.includes(nuevoEstado)) {
      const err = new Error(`No se puede transicionar del estado '${solicitud.estado}' a '${nuevoEstado}'. Transiciones válidas: [${estadosPosibles.join(', ')}]`);
      err.statusCode = 400;
      err.code = 'INVALID_TRANSITION';
      throw err;
    }

    // Regla estricta: al transicionar a Asignada, En Proceso o Resuelta, el técnico es obligatorio y no puede quedar vacío
    const requiereTecnico = ESTADOS_REQUIEREN_TECNICO.includes(nuevoEstado);
    const tecnicoNormalizado = (typeof tecnico === 'string') ? tecnico.trim() : '';

    if (requiereTecnico && (!tecnico || tecnicoNormalizado === '')) {
      const err = new Error(`El campo técnico es obligatorio para el estado '${nuevoEstado}'`);
      err.statusCode = 400;
      err.code = 'BAD_REQUEST';
      throw err;
    }

    const now = new Date().toISOString();
    const nextHistorialIndex = solicitud.historial.length + 1;
    const historialId = `HST-${String(nextHistorialIndex).padStart(2, '0')}`;

    const tecnicoFinal = requiereTecnico ? tecnicoNormalizado : (tecnicoNormalizado || solicitud.tecnico);

    const historialItem = {
      id: historialId,
      fechaHora: now,
      accion: 'ACTUALIZACION_ESTADO',
      estadoAnterior: solicitud.estado,
      nuevoEstado,
      tecnicoAsignado: tecnicoFinal || null,
      observaciones: (observaciones && typeof observaciones === 'string' && observaciones.trim())
        ? observaciones.trim()
        : `Transición de ${solicitud.estado} a ${nuevoEstado}`
    };

    solicitud.estado = nuevoEstado;
    solicitud.tecnico = tecnicoFinal || null;
    solicitud.fechaActualizacion = now;
    solicitud.historial.push(historialItem);

    return JSON.parse(JSON.stringify(solicitud));
  }
}

// Instancia Singleton compartida
const repositoryInstance = new SolicitudRepository();
export default repositoryInstance;
