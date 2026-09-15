export function errorHandler(err, req, res, next) {
  if (err.statusCode ? err.statusCode >= 500 : true) {
    console.error('[ServerError]', err);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
}
