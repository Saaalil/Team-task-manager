const express = require('express');
const TeamController = require('../controllers/teamController');
const { authenticateToken, requireTeamMembership, requireTeamAdmin, requireTeamOwner } = require('../middleware/auth');
const {
  validateTeamCreation,
  validateTeamUpdate,
  validateColumnCreation,
  validateColumnUpdate,
  validateUUID,
  handleValidationErrors
} = require('../middleware/validation');
const { body } = require('express-validator');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Team routes
router.get('/', TeamController.getUserTeams);
router.post('/', validateTeamCreation, TeamController.createTeam);

router.get('/:teamId', validateUUID('teamId'), requireTeamMembership, TeamController.getTeam);
router.put('/:teamId', validateUUID('teamId'), requireTeamAdmin, validateTeamUpdate, TeamController.updateTeam);
router.delete('/:teamId', validateUUID('teamId'), requireTeamOwner, TeamController.deleteTeam);

// Team member routes
router.get('/:teamId/members', validateUUID('teamId'), requireTeamMembership, TeamController.getTeamMembers);

router.post('/:teamId/members', validateUUID('teamId'), requireTeamAdmin, [
  body('userId').isUUID().withMessage('Valid user ID is required'),
  body('role').optional().isIn(['admin', 'member']).withMessage('Role must be admin or member'),
  handleValidationErrors
], TeamController.addTeamMember);

router.delete('/:teamId/members/:memberId', 
  validateUUID('teamId'), 
  validateUUID('memberId'), 
  requireTeamAdmin, 
  TeamController.removeTeamMember
);

router.put('/:teamId/members/:memberId/role', 
  validateUUID('teamId'), 
  validateUUID('memberId'), 
  requireTeamAdmin, 
  [
    body('role').isIn(['admin', 'member']).withMessage('Role must be admin or member'),
    handleValidationErrors
  ], 
  TeamController.updateMemberRole
);

// Task column routes
router.get('/:teamId/columns', validateUUID('teamId'), requireTeamMembership, TeamController.getTaskColumns);
router.post('/:teamId/columns', validateUUID('teamId'), requireTeamAdmin, validateColumnCreation, TeamController.createTaskColumn);

router.put('/:teamId/columns/:columnId', 
  validateUUID('teamId'), 
  validateUUID('columnId'), 
  requireTeamAdmin, 
  validateColumnUpdate, 
  TeamController.updateTaskColumn
);

router.delete('/:teamId/columns/:columnId', 
  validateUUID('teamId'), 
  validateUUID('columnId'), 
  requireTeamAdmin, 
  TeamController.deleteTaskColumn
);

// Team stats
router.get('/:teamId/stats', validateUUID('teamId'), requireTeamMembership, TeamController.getTeamStats);

module.exports = router;