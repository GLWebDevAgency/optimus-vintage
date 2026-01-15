/**
 * 🛡️ Middleware Collection
 * 
 * Enterprise-grade middleware for security, logging, and error handling.
 */

import type { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';

// ============ ERROR HANDLING ============

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static badRequest(message: string, code?: string) {
    return new ApiError(400, message, code || 'BAD_REQUEST');
  }

  static notFound(message: string = 'Resource not found') {
    return new ApiError(404, message, 'NOT_FOUND');
  }

  static internal(message: string = 'Internal server error') {
    return new ApiError(500, message, 'INTERNAL_ERROR');
  }
}

// Global error handler
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err);

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: {
        message: err.message,
        code: err.code,
      },
    });
  }

  // Don't expose internal errors in production
  const isProduction = process.env.NODE_ENV === 'production';
  return res.status(500).json({
    error: {
      message: isProduction ? 'An unexpected error occurred' : err.message,
      code: 'INTERNAL_ERROR',
    },
  });
}

// Async handler wrapper to catch errors
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// ============ VALIDATION MIDDLEWARE ============

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map((e: { path: (string | number)[]; message: string }) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return res.status(400).json({
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errors,
        },
      });
    }
    req.body = result.data;
    next();
  };
}

export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      return res.status(400).json({
        error: {
          message: 'Invalid parameters',
          code: 'INVALID_PARAMS',
        },
      });
    }
    // Store validated data in res.locals (Express 5 compatible)
    res.locals.params = result.data;
    next();
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({
        error: {
          message: 'Invalid query parameters',
          code: 'INVALID_QUERY',
        },
      });
    }
    // Store validated data in res.locals (Express 5 compatible)
    res.locals.query = result.data;
    next();
  };
}

// ============ LOGGING MIDDLEWARE ============

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = `[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`;
    
    if (res.statusCode >= 500) {
      console.error(log);
    } else if (res.statusCode >= 400) {
      console.warn(log);
    } else {
      console.log(log);
    }
  });
  
  next();
}

// ============ SECURITY MIDDLEWARE ============

export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.removeHeader('X-Powered-By');
  next();
}
