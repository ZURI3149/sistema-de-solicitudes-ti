/**
 * Middleware centralizado de manejo de errores
 */

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || (err.status || 500);
  const errorCode = err.code || (statusCode === 404 ? 'NOT_FOUND' : statusCode === 400 ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR');

  res.status(statusCode).json({
    error: errorCode,
    mensaje: err.message || 'Ha ocurrido un error inesperado en el servidor',
    detalles: err.detalles || [err.message]
  });
}

export default errorHandler;
