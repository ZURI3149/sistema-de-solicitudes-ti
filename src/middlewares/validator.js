/**
 * Middlewares de validación para solicitudes
 */

import { CATEGORIAS_PERMITIDAS, PRIORIDADES_PERMITIDAS, ESTADOS_PERMITIDOS, ESTADOS_REQUIEREN_TECNICO } from '../models/SolicitudRepository.js';

/**
 * Valida el payload de registro de una nueva solicitud
 */
export function validateCrearSolicitud(req, res, next) {
  const { solicitante, categoria, descripcion, prioridad } = req.body || {};
  const detalles = [];

  const requiredFields = [
    { key: 'solicitante', val: solicitante },
    { key: 'categoria', val: categoria },
    { key: 'descripcion', val: descripcion },
    { key: 'prioridad', val: prioridad }
  ];

  const faltantes = [];
  for (const field of requiredFields) {
    if (field.val === undefined || field.val === null || (typeof field.val === 'string' && field.val.trim() === '')) {
      faltantes.push(field.key);
    }
  }

  if (faltantes.length > 0) {
    return res.status(400).json({
      error: 'BAD_REQUEST',
      mensaje: 'Todos los campos son obligatorios: solicitante, categoria, descripcion, prioridad',
      detalles: faltantes.map(f => `El campo '${f}' es obligatorio y no puede estar vacío`)
    });
  }

  // Validar categorías permitidas
  if (!CATEGORIAS_PERMITIDAS.includes(categoria.trim())) {
    detalles.push(`El campo categoria debe ser ${CATEGORIAS_PERMITIDAS.join(', ')}`);
  }

  // Validar prioridades permitidas
  if (!PRIORIDADES_PERMITIDAS.includes(prioridad.trim())) {
    detalles.push(`El campo prioridad debe ser ${PRIORIDADES_PERMITIDAS.join(', ')}`);
  }

  // En el registro inicial, no se permite asignar técnico (debe ser null)
  if (req.body.tecnico !== undefined && req.body.tecnico !== null && req.body.tecnico !== '') {
    detalles.push('No se permite asignar técnico en el formulario de registro inicial');
  }

  if (detalles.length > 0) {
    return res.status(400).json({
      error: 'BAD_REQUEST',
      mensaje: 'Datos inválidos en el registro de la solicitud',
      detalles
    });
  }

  next();
}

/**
 * Valida el payload de actualización de estado
 */
export function validateActualizarEstado(req, res, next) {
  const { nuevoEstado, tecnico } = req.body || {};
  const detalles = [];

  if (!nuevoEstado || typeof nuevoEstado !== 'string' || nuevoEstado.trim() === '') {
    return res.status(400).json({
      error: 'BAD_REQUEST',
      mensaje: 'El campo nuevoEstado es obligatorio',
      detalles: ['Debe especificar un nuevoEstado válido']
    });
  }

  const estadoTrim = nuevoEstado.trim();
  if (!ESTADOS_PERMITIDOS.includes(estadoTrim)) {
    return res.status(400).json({
      error: 'BAD_REQUEST',
      mensaje: `El estado '${nuevoEstado}' no es válido`,
      detalles: [`Los estados permitidos son: ${ESTADOS_PERMITIDOS.join(', ')}`]
    });
  }

  // Validación de técnico para estados que lo requieren obligatoriamente
  if (ESTADOS_REQUIEREN_TECNICO.includes(estadoTrim)) {
    if (!tecnico || typeof tecnico !== 'string' || tecnico.trim() === '') {
      return res.status(400).json({
        error: 'BAD_REQUEST',
        mensaje: `El campo técnico es obligatorio para el estado '${estadoTrim}'`,
        detalles: [`Para transicionar a '${estadoTrim}', debe asignar un técnico responsable`]
      });
    }
  }

  next();
}

export default {
  validateCrearSolicitud,
  validateActualizarEstado
};
