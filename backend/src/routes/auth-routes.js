const { Router } = require('express');
const authController = require('../controllers/auth-controller');
const { verificarToken } = require('../middleware/auth-middleware');

const router = Router();

router.post('/registro', authController.registrar);
router.post('/login', authController.login);
router.put('/cambiar-password', verificarToken, authController.cambiarPassword);

module.exports = router;
