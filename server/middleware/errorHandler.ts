/**
 * Error Handling Middleware
 * Location: server/middleware/errorHandler.ts
 */

import { Request, Response, NextFunction } from "express";

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * Async request wrapper to catch errors
 */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

/**
 * Global error handler middleware (must be last)
 */
export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error
  console.error("Error:", {
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
  });

  // Default error response
  let statusCode = 500;
  let message = "Internal server error";
  let code = "INTERNAL_ERROR";
  let details: unknown;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    code = err.code || "API_ERROR";
    details = err.details;
  } else if (err instanceof SyntaxError) {
    statusCode = 400;
    message = "Invalid request body";
    code = "INVALID_JSON";
  }

  res.status(statusCode).json({
    success: false,
    message,
    code,
    details:
      process.env.NODE_ENV === "development"
        ? { error: err.message, stack: err.stack }
        : undefined,
  });
};

/**
 * 404 handler (must be before error handler)
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`,
    code: "NOT_FOUND",
  });
};

/**
 * Validation error formatter
 */
export const formatValidationError = (errors: any[]) => {
  return errors.reduce(
    (acc, error) => ({
      ...acc,
      [error.path]: error.message,
    }),
    {}
  );
};
