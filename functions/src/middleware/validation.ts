import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';

// Validation middleware factory
export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      if (req.body && Object.keys(req.body).length > 0) {
        schema.parse(req.body);
      }

      // Validate query parameters if schema expects them
      if (req.query && Object.keys(req.query).length > 0) {
        try {
          schema.parse(req.query);
        } catch (error) {
          // Query validation is optional, so we ignore errors
        }
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors: Record<string, string[]> = {};
        
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          if (!errors[path]) {
            errors[path] = [];
          }
          errors[path].push(err.message);
        });

        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          errors,
        });
      }

      console.error('Validation error:', error);
      res.status(500).json({
        success: false,
        error: 'Validation error',
      });
    }
  };
};

// Validate query parameters
export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.query && Object.keys(req.query).length > 0) {
        schema.parse(req.query);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors: Record<string, string[]> = {};
        
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          if (!errors[path]) {
            errors[path] = [];
          }
          errors[path].push(err.message);
        });

        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          errors,
        });
      }

      console.error('Query validation error:', error);
      res.status(500).json({
        success: false,
        error: 'Validation error',
      });
    }
  };
};

// Validate params
export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.params && Object.keys(req.params).length > 0) {
        schema.parse(req.params);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors: Record<string, string[]> = {};
        
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          if (!errors[path]) {
            errors[path] = [];
          }
          errors[path].push(err.message);
        });

        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          errors,
        });
      }

      console.error('Params validation error:', error);
      res.status(500).json({
        success: false,
        error: 'Validation error',
      });
    }
  };
};

// Common validation schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export const idSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format'),
});

export const searchSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export const sortSchema = z.object({
  field: z.string().default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});
