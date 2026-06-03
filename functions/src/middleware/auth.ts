import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import User from '../models/User';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
      user?: any;
    }
  }
}

// Authentication middleware
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token required',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string };
    
    if (!decoded?.userId) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
    }

    // Check if user exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Account is deactivated',
      });
    }

    // Attach user to request
    req.userId = user._id.toString();
    req.userRole = user.role;
    req.user = user;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      error: 'Authentication failed',
    });
  }
};

// Authorization middleware
export const authorize = (permissions: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if user is authenticated
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      // Get user permissions
      const userPermissions = req.user?.permissions || [];
      
      // Normalize permissions to array
      const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];

      // Check if user has any of the required permissions
      const hasPermission = requiredPermissions.some((permission) =>
        userPermissions.includes(permission)
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
        });
      }

      next();
    } catch (error) {
      console.error('Authorization error:', error);
      res.status(403).json({
        success: false,
        error: 'Authorization failed',
      });
    }
  };
};

// Role-based authorization middleware
export const authorizeRoles = (roles: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if user is authenticated
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      // Normalize roles to array
      const requiredRoles = Array.isArray(roles) ? roles : [roles];

      // Check if user has any of the required roles
      const hasRole = requiredRoles.includes(req.userRole as string);

      if (!hasRole) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
        });
      }

      next();
    } catch (error) {
      console.error('Role authorization error:', error);
      res.status(403).json({
        success: false,
        error: 'Authorization failed',
      });
    }
  };
};

// Check if user is the owner of a resource
export const checkOwnership = (model: any, idParam: string = 'id') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if user is authenticated
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      // Get resource ID from request
      const resourceId = req.params[idParam];
      
      if (!resourceId) {
        return res.status(400).json({
          success: false,
          error: 'Resource ID is required',
        });
      }

      // Find the resource
      const resource = await model.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          error: 'Resource not found',
        });
      }

      // Check if user is the owner
      // This assumes the resource has an 'author' or 'user' field
      const isOwner = 
        resource.author?.toString() === req.userId ||
        resource.user?.toString() === req.userId ||
        resource.createdBy?.toString() === req.userId;

      if (!isOwner) {
        return res.status(403).json({
          success: false,
          error: 'You do not own this resource',
        });
      }

      // Attach resource to request
      req.body.resource = resource;

      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      res.status(500).json({
        success: false,
        error: 'Ownership verification failed',
      });
    }
  };
};
