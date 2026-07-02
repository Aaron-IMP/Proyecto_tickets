const authService = require('../services/auth-service');

const registrar = async (req, res) => {
  try {
    const { nombre, email, contrasena } = req.body;

    if (!nombre || !email || !contrasena) {
      return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos' });
    }

    const usuario = await authService.registrar(nombre, email, contrasena);
    return res.status(201).json({ mensaje: 'Usuario registrado', usuario });
  } catch (error) {
    if (error.message === 'EMAIL_EN_USO') {
      return res.status(409).json({ error: 'El correo ya está registrado' });
    }
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const login = async (req, res) => {
  try {
    const { email, contrasena } = req.body;

    if (!email || !contrasena) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    const resultado = await authService.login(email, contrasena);
    return res.status(200).json(resultado);
  } catch (error) {
    if (error.message === 'CREDENCIALES_INVALIDAS') {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const cambiarPassword = async (req, res) => {
  try {
    const { contrasenaActual, contrasenaNueva } = req.body;

    if (!contrasenaActual || !contrasenaNueva) {
      return res.status(400).json({ error: 'Contraseña actual y nueva son requeridas' });
    }
    if (contrasenaNueva.length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }

    await authService.cambiarPassword(req.usuario.id, contrasenaActual, contrasenaNueva);
    return res.status(200).json({ mensaje: 'Contraseña actualizada correctamente' });
  } catch (error) {
    if (error.message === 'CONTRASENA_INCORRECTA') {
      return res.status(400).json({ error: 'Contraseña actual incorrecta' });
    }
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { registrar, login, cambiarPassword };
