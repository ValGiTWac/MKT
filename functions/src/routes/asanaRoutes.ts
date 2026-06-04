import express from 'express';
import { asanaService } from '../services/asanaService';
import { authenticate } from '../middleware/authMiddleware';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// @route   GET /api/asana/connect
// @desc    Get Asana OAuth URL for connection
// @access  Private
router.get(
  '/connect',
  authenticate,
  asyncHandler(async (req, res) => {
    const url = await asanaService.getOAuthUrl();
    
    res.json({
      success: true,
      data: { url },
    });
  })
);

// @route   GET /api/asana/callback
// @desc    Asana OAuth callback (handled by frontend redirect)
// @access  Public
router.get(
  '/callback',
  asyncHandler(async (req, res) => {
    const { code, state } = req.query;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Authorization code is required',
      });
    }

    // In a real implementation, we would exchange the code for a token
    // and associate it with the user
    // For now, just redirect to the frontend
    res.redirect('https://whise-mkt.netlify.app/settings?asana=connected');
  })
);

// @route   POST /api/asana/disconnect
// @desc    Disconnect Asana
// @access  Private
router.post(
  '/disconnect',
  authenticate,
  asyncHandler(async (req, res) => {
    await asanaService.disconnect(req.user!._id.toString());
    
    res.json({
      success: true,
      message: 'Asana disconnected successfully',
    });
  })
);

// @route   GET /api/asana/status
// @desc    Check Asana connection status
// @access  Private
router.get(
  '/status',
  authenticate,
  asyncHandler(async (req, res) => {
    const status = await asanaService.checkStatus(req.user!._id.toString());
    
    res.json({
      success: true,
      data: status,
    });
  })
);

// @route   GET /api/asana/projects
// @desc    Get Asana projects
// @access  Private
router.get(
  '/projects',
  authenticate,
  asyncHandler(async (req, res) => {
    const projects = await asanaService.getProjects(req.user!._id.toString());
    
    res.json({
      success: true,
      data: projects,
    });
  })
);

// @route   GET /api/asana/users
// @desc    Get Asana users
// @access  Private
router.get(
  '/users',
  authenticate,
  asyncHandler(async (req, res) => {
    const users = await asanaService.getUsers(req.user!._id.toString());
    
    res.json({
      success: true,
      data: users,
    });
  })
);

// @route   POST /api/asana/tasks
// @desc    Create a new task in Asana
// @access  Private
router.post(
  '/tasks',
  authenticate,
  asyncHandler(async (req, res) => {
    const { name, description, assignee, dueDate, projectId, postId } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Name is required',
      });
    }

    const task = await asanaService.createTask(req.user!._id.toString(), {
      name,
      description,
      assignee,
      dueDate,
      projectId,
      postId,
    });

    res.status(201).json({
      success: true,
      data: task,
      message: 'Task created successfully',
    });
  })
);

// @route   GET /api/asana/tasks/:id
// @desc    Get task by ID
// @access  Private
router.get(
  '/tasks/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const task = await asanaService.getTaskById(req.user!._id.toString(), req.params.id);
    
    res.json({
      success: true,
      data: task,
    });
  })
);

// @route   PUT /api/asana/tasks/:id
// @desc    Update task
// @access  Private
router.put(
  '/tasks/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const task = await asanaService.updateTask(
      req.user!._id.toString(),
      req.params.id,
      req.body
    );

    res.json({
      success: true,
      data: task,
      message: 'Task updated successfully',
    });
  })
);

// @route   DELETE /api/asana/tasks/:id
// @desc    Delete task
// @access  Private
router.delete(
  '/tasks/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    await asanaService.deleteTask(req.user!._id.toString(), req.params.id);
    
    res.json({
      success: true,
      message: 'Task deleted successfully',
    });
  })
);

// @route   GET /api/asana/projects/:id/tasks
// @desc    Get tasks by project
// @access  Private
router.get(
  '/projects/:id/tasks',
  authenticate,
  asyncHandler(async (req, res) => {
    const tasks = await asanaService.getTasksByProject(
      req.user!._id.toString(),
      req.params.id
    );
    
    res.json({
      success: true,
      data: tasks,
    });
  })
);

// @route   POST /api/asana/posts/:postId/tasks
// @desc    Create task from WHISE post
// @access  Private
router.post(
  '/posts/:postId/tasks',
  authenticate,
  asyncHandler(async (req, res) => {
    const { projectId } = req.body;
    const task = await asanaService.createTaskFromPost(
      req.user!._id.toString(),
      req.params.postId,
      projectId
    );

    res.status(201).json({
      success: true,
      data: task,
      message: 'Task created from post successfully',
    });
  })
);

// @route   PUT /api/asana/tasks/:id/complete
// @desc    Complete task
// @access  Private
router.put(
  '/tasks/:id/complete',
  authenticate,
  asyncHandler(async (req, res) => {
    const task = await asanaService.completeTask(req.user!._id.toString(), req.params.id);
    
    res.json({
      success: true,
      data: task,
      message: 'Task completed successfully',
    });
  })
);

// @route   GET /api/asana/analytics
// @desc    Get Asana analytics
// @access  Private
router.get(
  '/analytics',
  authenticate,
  asyncHandler(async (req, res) => {
    const days = parseInt(req.query.days as string) || 30;
    const analytics = await asanaService.getAnalytics(req.user!._id.toString(), days);
    
    res.json({
      success: true,
      data: analytics,
    });
  })
);

export default router;
