const { Router } = require('express');
const incidenteController = require('../controllers/incidente-controller');
const { verificarToken, verificarRol } = require('../middleware/auth-middleware');

const router = Router();

router.post(
  '/',
  verificarToken,
  verificarRol('seguridad', 'admin'),
  incidenteController.reportar
);

module.exports = router;
