const { Router } = require('express');
const eventoController = require('../controllers/evento-controller');
const { verificarToken, verificarRol } = require('../middleware/auth-middleware');

const router = Router();

router.get('/admin',               verificarToken, verificarRol('admin'), eventoController.listarAdmin);
router.get('/',                    eventoController.listar);
router.get('/:id',                 eventoController.obtener);
router.get('/:id/metricas',        verificarToken, verificarRol('admin'), eventoController.verMetricas);
router.get('/:id/compradores',     verificarToken, verificarRol('admin'), eventoController.verCompradores);
router.post('/',                   verificarToken, verificarRol('admin'), eventoController.crear);
router.delete('/:id/cancelar',     verificarToken, verificarRol('admin'), eventoController.cancelar);

module.exports = router;
