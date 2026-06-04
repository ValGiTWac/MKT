import jwt from 'jsonwebtoken';
import User from '../models/User';
import { JWT_SECRET } from '../middleware/authMiddleware';
import { createError } from '../middleware/errorHandler';

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

export const authService = {
  // Register a new user (admin only)
  register: async (userData: {
    email: string;
    password: string;
    name: string;
    role?: string;
  }) => {
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw createError('User with this email already exists', 400);
    }

    const user = new User(userData);
    await user.save();
    
    // Return user without password
    return user.userWithoutPassword;
  },

  // Login user
  login: async (email: string, password: string) => {
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      throw createError('Invalid credentials', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw createError('Invalid credentials', 401);
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    return {
      user: user.userWithoutPassword,
      token,
      expiresIn: JWT_EXPIRES_IN,
    };
  },

  // Get current user
  getCurrentUser: async (userId: string) => {
    const user = await User.findById(userId);
    if (!user) {
      throw createError('User not found', 404);
    }
    return user.userWithoutPassword;
  },

  // Update user profile
  updateProfile: async (userId: string, updateData: Partial<{
    name: string;
    email: string;
    avatar: string;
  }>) => {
    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    });
    
    if (!user) {
      throw createError('User not found', 404);
    }

    return user.userWithoutPassword;
  },

  // Change password
  changePassword: async (userId: string, currentPassword: string, newPassword: string) => {
    const user = await User.findById(userId).select('+password');
    
    if (!user) {
      throw createError('User not found', 404);
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw createError('Current password is incorrect', 401);
    }

    user.password = newPassword;
    await user.save();
    
    return user.userWithoutPassword;
  },

  // Get all users (admin only)
  getAllUsers: async () => {
    const users = await User.find().select('-password');
    return users;
  },

  // Update user role (admin only)
  updateUserRole: async (userId: string, role: string) => {
    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true }
    );
    
    if (!user) {
      throw createError('User not found', 404);
    }

    return user.userWithoutPassword;
  },

  // Delete user (admin only)
  deleteUser: async (userId: string) => {
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      throw createError('User not found', 404);
    }
    return true;
  },
};
