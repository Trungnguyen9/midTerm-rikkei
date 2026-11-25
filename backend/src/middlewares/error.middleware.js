const AppError = require('../utils/AppError');

function notFoundHandler(_req, _res, next) {
  next(new AppError(404, 'NOT_FOUND', 'Đường dẫn không tồn tại'));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
      },
    });
  }

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Dữ liệu JSON không hợp lệ',
      },
    });
  }

  return res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Lỗi hệ thống, vui lòng thử lại sau',
    },
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};

