export class AppError extends Error {
  constructor(statusCode, message, details = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
  }
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode ?? 500;
  const message =
    statusCode === 500 && process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Internal server error';

  const body = {
    success: false,
    error: message,
  };
  if (err.details !== undefined) {
    body.details = err.details;
  }

  if (statusCode === 500 && process.env.NODE_ENV !== 'production') {
    body.stack = err.stack;
  }

  res.status(statusCode).json(body);
}

export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
