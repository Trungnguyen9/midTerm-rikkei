const express = require('express');
const borrowingController = require('../controllers/borrowing.controller');
const validate = require('../middlewares/validate.middleware');
const { idParamSchema } = require('../validators/common.validator');
const {
  borrowingQuerySchema,
  createBorrowingBodySchema,
} = require('../validators/borrowing.validator');

const router = express.Router();

router.get('/', validate({ query: borrowingQuerySchema }), borrowingController.listBorrowings);
router.post(
  '/',
  validate({ body: createBorrowingBodySchema }),
  borrowingController.createBorrowing
);
router.patch(
  '/:id/return',
  validate({ params: idParamSchema }),
  borrowingController.returnBorrowing
);

module.exports = router;

