const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { insertarUsuario, buscarPorEmail, buscarHashPorId, actualizarContrasena } = require('../queries/auth-queries');
const { sendEmail } = require('../config/mailer');
const { bienvenida } = require('../utils/email-templates');

const SALT_ROUNDS = 10;

const registrar = async (nombre, email, contrasena) => {
  const usuarioExistente = await buscarPorEmail(email);
  if (usuarioExistente) {
    throw new Error('EMAIL_EN_USO');
  }

  const contrasenaHash = await bcrypt.hash(contrasena, SALT_ROUNDS);
  const usuario = await insertarUsuario(nombre, email, contrasenaHash);

  const tpl = bienvenida(usuario.nombre);
  sendEmail({ to: usuario.email, ...tpl })
    .catch(err => console.error('Error correo bienvenida:', err));

  return usuario;
};

const login = async (email, contrasena) => {
  const usuario = await buscarPorEmail(email);
  if (!usuario) {
    throw new Error('CREDENCIALES_INVALIDAS');
  }

  const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena_hash);
  if (!contrasenaValida) {
    throw new Error('CREDENCIALES_INVALIDAS');
  }

  const payload = {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
    fechaRegistro: usuario.fecha_registro,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

  return { usuario: payload, token };
};

const cambiarPassword = async (usuarioId, contrasenaActual, contrasenaNueva) => {
  const fila = await buscarHashPorId(usuarioId);
  if (!fila) throw new Error('USUARIO_NO_ENCONTRADO');

  const coincide = await bcrypt.compare(contrasenaActual, fila.contrasena_hash);
  if (!coincide) throw new Error('CONTRASENA_INCORRECTA');

  const nuevoHash = await bcrypt.hash(contrasenaNueva, SALT_ROUNDS);
  await actualizarContrasena(usuarioId, nuevoHash);
};

module.exports = { registrar, login, cambiarPassword };
