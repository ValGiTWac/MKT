import express from 'express';
import { authService } from '../services/authService';
import { authenticate, isAdmin } from '../middleware/authMiddleware';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user (admin only)
// @access  Private/Admin
router.post(
  '/register',
  authenticate,
  isAdmin,
  asyncHandler(async (req, res) => {
    const { email, password, name, role } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and name are required',
      });
    }

    const user = await authService.register({
      email,
      password,
      name,
      role: role || 'editor',
    });

    res.json({
      success: true,
      data: user,
      message: 'User registered successfully',
    });
  })
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    const result = await authService.login(email, password);

    res.json({
      success: true,
      data: result,
      message: 'Login successful',
    });
  })
);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await authService.getCurrentUser(req.user!._id.toString());
    
    res.json({
      success: true,
      data: user,
    });
  })
);

// @route   PUT /api/auth/me
// @desc    Update user profile
// @access  Private
router.put(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await authService.updateProfile(
      req.user!._id.toString(),
      req.body
    );
    
    res.json({
      success: true,
      data: user,
      message: 'Profile updated successfully',
    });
  })
);

// @route   PUT /api/auth/change-password
// @desc    Change password
// @access  Private
router.put(
  '/change-password',
  authenticate,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required',
      });
    }

    await authService.changePassword(
      req.user!._id.toString(),
      currentPassword,
      newPassword
    );
    
    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  })
);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post(
  '/logout',
  authenticate,
  asyncHandler(async (req, res) => {
    // In JWT, logout is handled client-side by removing the token
    res.json({
      success: true,
      message: 'Logout successful',
    });
  })
);

// @route   GET /api/auth/users
// @desc    Get all users (admin only)
// @access  Private/Admin
router.get(
  '/users',
  authenticate,
  isAdmin,
  asyncHandler(async (req, res) => {
    const users = await authService.getAllUsers();
    
    res.json({
      success: true,
      data: users,
    });
  })
);

// @route   PUT /api/auth/users/:id/role
// @desc    Update user role (admin only)
// @access  Private/Admin
router.put(
  '/users/:id/role',
  authenticate,
  isAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!role) {
      return res.status(400).json({
        success: false,
        error: 'Role is required',
      });
    }

    const user = await authService.updateUserRole(id, role);
    
    res.json({
      success: true,
      data: user,
      message: 'User role updated successfully',
    });
  })
);

// @route   DELETE /api/auth/users/:id
// @desc    Delete user (admin only)
// @access  Private/Admin
router.delete(
  '/users/:id',
  authenticate,
  isAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    await authService.deleteUser(id);
    
    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  })
);

export default router;
