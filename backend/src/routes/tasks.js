const express = require('express');
const TaskController = require('../controllers/taskController');
const { authenticateToken, requireTeamMembership } = require('../middleware/auth');
const {
  validateTaskCreation,
  validateTaskUpdate,
  validateTaskMove,
  validateTaskComment,
  validateUUID,
  handleValidationErrors
} = require('../middleware/validation');
const { query } = require('express-validator');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Middleware to attach io to request for socket emissions
router.use((req, res, next) => {
  req.io = req.app.get('io');
  next();
});

// User's tasks (across all teams or specific team)
router.get('/my-tasks', [
  query('teamId').optional().isUUID().withMessage('Team ID must be a valid UUID'),
  handleValidationErrors
], TaskController.getUserTasks);

// Team tasks routes
router.get('/teams/:teamId', validateUUID('teamId'), requireTeamMembership, TaskController.getTeamTasks);
router.post('/teams/:teamId', validateUUID('teamId'), requireTeamMembership, validateTaskCreation, TaskController.createTask);

// Task stats for a team
router.get('/teams/:teamId/stats', validateUUID('teamId'), requireTeamMembership, TaskController.getTaskStats);

// Individual task routes
router.get('/:taskId', validateUUID('taskId'), TaskController.getTask);
router.put('/:taskId', validateUUID('taskId'), validateTaskUpdate, TaskController.updateTask);
router.delete('/:taskId', validateUUID('taskId'), TaskController.deleteTask);

// Task movement (drag and drop)
router.put('/:taskId/move', validateUUID('taskId'), validateTaskMove, TaskController.moveTask);

// Task comments
router.get('/:taskId/comments', validateUUID('taskId'), TaskController.getTaskComments);
router.post('/:taskId/comments', validateUUID('taskId'), validateTaskComment, TaskController.addTaskComment);

router.put('/:taskId/comments/:commentId', 
  validateUUID('taskId'), 
  validateUUID('commentId'), 
  validateTaskComment, 
  TaskController.updateTaskComment
);

router.delete('/:taskId/comments/:commentId', 
  validateUUID('taskId'), 
  validateUUID('commentId'), 
  TaskController.deleteTaskComment
);

module.exports = router;