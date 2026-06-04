import express from 'express';
import { authService } from '../services/authService';
import { authenticate, isAdmin } from '../middleware/authMiddleware';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (admin only)
// @access  Private/Admin
router.get(
  '/',
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

// @route   PUT /api/users/:id/role
// @desc    Update user role (admin only)
// @access  Private/Admin
router.put(
  '/:id/role',
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

// @route   DELETE /api/users/:id
// @desc    Delete user (admin only)
// @access  Private/Admin
router.delete(
  '/:id',
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
