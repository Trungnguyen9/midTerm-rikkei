const borrowingService = require('../services/borrowing.service');

async function listBorrowings(req, res, next) {
  try {
    const result = await borrowingService.listBorrowings(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function createBorrowing(req, res, next) {
  try {
    const data = await borrowingService.createBorrowing(req.body);
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
}

async function returnBorrowing(req, res, next) {
  try {
    const data = await borrowingService.returnBorrowing(req.params.id);
    res.status(200).json({ data });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listBorrowings,
  createBorrowing,
  returnBorrowing,
};

