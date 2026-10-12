/**
 * Servidor HTTP principal para el Sistema de Solicitudes
 */

import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Sistema de Solicitudes] Servidor iniciado y escuchando en el puerto ${PORT}`);
  console.log(`[Sistema de Solicitudes] URL local: http://localhost:${PORT}`);
});

export default server;
