/**
 * Controlador de solicitudes y ciclo de vida de tickets
 */

import repository from '../models/SolicitudRepository.js';

export class SolicitudesController {
  /**
   * POST /api/solicitudes
   * Registra una nueva solicitud
   */
  static async crear(req, res, next) {
    try {
      const { solicitante, categoria, descripcion, prioridad } = req.body;
      const nuevaSolicitud = repository.create({
        solicitante,
        categoria,
        descripcion,
        prioridad
      });
      return res.status(201).json(nuevaSolicitud);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/solicitudes
   * Lista todas las solicitudes registradas
   */
  static async listar(req, res, next) {
    try {
      const lista = repository.findAll();
      return res.status(200).json(lista);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/solicitudes/:codigo
   * Consulta una solicitud por su código alfanumérico
   */
  static async obtenerPorCodigo(req, res, next) {
    try {
      const rawCodigo = req.params.codigo;
      const codigo = rawCodigo ? rawCodigo.trim().toUpperCase() : '';
      const solicitud = repository.findByCodigo(codigo);

      if (!solicitud) {
        return res.status(404).json({
          error: 'NOT_FOUND',
          mensaje: `No se encontró ninguna solicitud con el código ${rawCodigo}`
        });
      }

      return res.status(200).json(solicitud);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/solicitudes/:codigo/estado
   * Actualiza el estado y asigna técnico con registro en auditoría
   */
  static async actualizarEstado(req, res, next) {
    try {
      const rawCodigo = req.params.codigo;
      const codigo = rawCodigo ? rawCodigo.trim().toUpperCase() : '';
      const { nuevoEstado, tecnico, observaciones } = req.body;

      // Verificar si la solicitud existe antes de proceder
      const existente = repository.findByCodigo(codigo);
      if (!existente) {
        return res.status(404).json({
          error: 'NOT_FOUND',
          mensaje: `No se encontró ninguna solicitud con el código ${rawCodigo}`
        });
      }

      const actualizada = repository.updateEstado(codigo, {
        nuevoEstado,
        tecnico,
        observaciones
      });

      return res.status(200).json(actualizada);
    } catch (error) {
      next(error);
    }
  }
}

export default SolicitudesController;
