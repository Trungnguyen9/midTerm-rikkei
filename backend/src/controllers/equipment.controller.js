const equipmentService = require('../services/equipment.service');

async function listEquipments(req, res, next) {
  try {
    const result = await equipmentService.listEquipments(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function getEquipmentById(req, res, next) {
  try {
    const data = await equipmentService.getEquipmentById(req.params.id);
    res.status(200).json({ data });
  } catch (err) {
    next(err);
  }
}

async function createEquipment(req, res, next) {
  try {
    const data = await equipmentService.createEquipment(req.body);
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
}

async function updateEquipment(req, res, next) {
  try {
    const data = await equipmentService.updateEquipment(req.params.id, req.body);
    res.status(200).json({ data });
  } catch (err) {
    next(err);
  }
}

async function deleteEquipment(req, res, next) {
  try {
    await equipmentService.deleteEquipment(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listEquipments,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
};

