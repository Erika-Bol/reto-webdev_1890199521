const express = require('express');
const router = express.Router();
const {
  getCatalogo,
  getDetalleVehiculo,
  publicarVehiculo,
  getMisPublicaciones,
  editarVehiculo
} = require('../controllers/vehiclesController');
const { verificarToken } = require('../middlewares/authMiddleware');

// Rutas públicas (Lectura del catálogo y detalles)
router.get('/catalogo', getCatalogo);
router.get('/:id', getDetalleVehiculo);

// Rutas protegidas (Requieren Login obligatorio)
router.post('/', verificarToken, publicarVehiculo);
router.get('/usuario/mis-publicaciones', verificarToken, getMisPublicaciones);
router.put('/:id', verificarToken, editarVehiculo);

module.exports = router;