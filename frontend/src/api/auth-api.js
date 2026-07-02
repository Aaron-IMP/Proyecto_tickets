import api from './axios-config';

export const loginApi = (email, contrasena) =>
  api.post('/api/auth/login', { email, contrasena });

export const registroApi = (nombre, email, contrasena) =>
  api.post('/api/auth/registro', { nombre, email, contrasena });

export const cambiarPasswordApi = (contrasenaActual, contrasenaNueva) =>
  api.put('/api/auth/cambiar-password', { contrasenaActual, contrasenaNueva });
