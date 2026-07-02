const { Router } = require('express');
const pagoController = require('../controllers/pago-controller');
const { verificarToken, verificarRol } = require('../middleware/auth-middleware');

const router = Router();

// Historial — debe ir ANTES de /:referencia para no ser capturado por el parámetro
router.get(
  '/historial',
  verificarToken,
  verificarRol('cliente'),
  pagoController.historial,
);

// Iniciar + procesar pago (cliente solamente)
router.post(
  '/iniciar',
  verificarToken,
  verificarRol('cliente'),
  pagoController.iniciarYProcesar,
);

// Consultar estado de un pago por su referencia UUID
router.get(
  '/:referencia',
  verificarToken,
  verificarRol('cliente'),
  pagoController.obtenerPago,
);

module.exports = router;
