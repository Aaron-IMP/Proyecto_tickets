const { Router } = require('express');
const reventaController = require('../controllers/reventa-controller');
const { verificarToken, verificarRol } = require('../middleware/auth-middleware');

const router = Router();

// Rutas específicas ANTES que /:id para evitar conflictos
router.post('/publicar',          verificarToken, verificarRol('cliente'), reventaController.publicar);
router.get('/mis-publicaciones',  verificarToken,                          reventaController.misPublicaciones);
router.get('/mis-ventas',         verificarToken,                          reventaController.misVentas);
router.get('/',                                                            reventaController.listar);
router.get('/:id',                                                         reventaController.obtener);
router.post('/:id/comprar',       verificarToken, verificarRol('cliente'), reventaController.comprar);
router.delete('/:id/cancelar',    verificarToken,                          reventaController.cancelar);

module.exports = router;
