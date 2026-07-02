const { Router } = require('express');
const ticketController = require('../controllers/ticket-controller');
const { verificarToken, verificarRol } = require('../middleware/auth-middleware');

const router = Router();

// Rutas fijas primero (antes del parámetro /:uuid/*)
router.get('/mis-tickets', verificarToken, ticketController.misTickets);
router.post('/comprar', verificarToken, verificarRol('cliente'), ticketController.comprar);
router.post('/validar', verificarToken, verificarRol('seguridad', 'admin'), ticketController.validar);

// Ruta dinámica: el dueño obtiene el token TOTP actual para mostrar el QR
router.get('/:uuid/token', verificarToken, ticketController.obtenerToken);

module.exports = router;
