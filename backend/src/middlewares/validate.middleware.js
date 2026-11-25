const AppError = require('../utils/AppError');

/**
 * Validate req.params, req.query, and/or req.body against Zod schemas.
 * @param {{ params?: import('zod').ZodTypeAny, query?: import('zod').ZodTypeAny, body?: import('zod').ZodTypeAny }} schemas
 */
function validate(schemas) {
  return (req, _res, next) => {
    try {
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      next();
    } catch (err) {
      if (err && Array.isArray(err.errors) && err.errors.length > 0) {
        const firstMessage = err.errors[0].message || 'Dữ liệu không hợp lệ';
        return next(new AppError(400, 'VALIDATION_ERROR', firstMessage));
      }
      next(err);
    }
  };
}

module.exports = validate;

