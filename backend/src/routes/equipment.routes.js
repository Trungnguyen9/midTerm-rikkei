const express = require('express');
const equipmentController = require('../controllers/equipment.controller');
const validate = require('../middlewares/validate.middleware');
const { idParamSchema } = require('../validators/common.validator');
const {
  equipmentQuerySchema,
  equipmentBodySchema,
} = require('../validators/equipment.validator');

const router = express.Router();

router.get('/', validate({ query: equipmentQuerySchema }), equipmentController.listEquipments);
router.get('/:id', validate({ params: idParamSchema }), equipmentController.getEquipmentById);
router.post('/', validate({ body: equipmentBodySchema }), equipmentController.createEquipment);
router.put(
  '/:id',
  validate({ params: idParamSchema, body: equipmentBodySchema }),
  equipmentController.updateEquipment
);
router.delete('/:id', validate({ params: idParamSchema }), equipmentController.deleteEquipment);

module.exports = router;

