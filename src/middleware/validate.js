import { AppError } from '../utils/apiError.js';

// Validate and coerce JSON request bodies with a Zod schema
export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(
        new AppError(400, 'Validation failed', result.error.flatten()),
      );
    }
    req.body = result.data;
    next();
  };
}

// Validate and coerce querystring parameters with a Zod schema
export function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return next(
        new AppError(400, 'Validation failed', result.error.flatten()),
      );
    }
    // Express 5: req.query is read-only — attach parsed query here
    req.validatedQuery = result.data;
    next();
  };
}
