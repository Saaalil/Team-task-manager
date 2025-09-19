const Team = require('../models/Team');
const User = require('../models/User');
const Task = require('../models/Task');
const { v4: uuidv4 } = require('uuid');

class TeamController {
  // Get all teams for the authenticated user
  static async getUserTeams(req, res) {
    try {
      const userId = req.user.id;
      const teams = await User.getUserTeams(userId);

      res.json({
        success: true,
        data: {
          teams
        }
      });
    } catch (error) {
      console.error('Get user teams error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get teams'
      });
    }
  }

  // Get team by ID
  static async getTeam(req, res) {
    try {
      const { teamId } = req.params;
      
      const team = await Team.findById(teamId);
      if (!team) {
        return res.status(404).json({
          success: false,
          message: 'Team not found'
        });
      }

      // Get team members
      const members = await Team.getTeamMembers(teamId);
      
      // Get task columns
      const columns = await Team.getTaskColumns(teamId);
      
      // Get team stats
      const stats = await Team.getTeamStats(teamId);

      res.json({
        success: true,
        data: {
          team: {
            ...team,
            members,
            columns,
            stats
          }
        }
      });
    } catch (error) {
      console.error('Get team error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get team'
      });
    }
  }

  // Create new team
  static async createTeam(req, res) {
    try {
      const { name, description, slug } = req.body;
      const ownerId = req.user.id;

      // Generate slug if not provided
      const teamSlug = slug || name.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-') + '-' + Math.random().toString(36).substr(2, 6);

      // Check if slug is unique
      const existingTeam = await Team.findBySlug(teamSlug);
      if (existingTeam) {
        return res.status(409).json({
          success: false,
          message: 'Team slug already exists'
        });
      }

      const team = await Team.create({
        name,
        description,
        slug: teamSlug,
        ownerId
      });

      res.status(201).json({
        success: true,
        message: 'Team created successfully',
        data: {
          team
        }
      });
    } catch (error) {
      console.error('Create team error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create team'
      });
    }
  }

  // Update team
  static async updateTeam(req, res) {
    try {
      const { teamId } = req.params;
      const { name, description, avatarUrl } = req.body;

      const updatedTeam = await Team.update(teamId, {
        name,
        description,
        avatarUrl
      });

      if (!updatedTeam) {
        return res.status(404).json({
          success: false,
          message: 'Team not found'
        });
      }

      res.json({
        success: true,
        message: 'Team updated successfully',
        data: {
          team: updatedTeam
        }
      });
    } catch (error) {
      console.error('Update team error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update team'
      });
    }
  }

  // Delete team
  static async deleteTeam(req, res) {
    try {
      const { teamId } = req.params;

      const deleted = await Team.delete(teamId);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Team not found'
        });
      }

      res.json({
        success: true,
        message: 'Team deleted successfully'
      });
    } catch (error) {
      console.error('Delete team error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete team'
      });
    }
  }

  // Get team members
  static async getTeamMembers(req, res) {
    try {
      const { teamId } = req.params;
      
      const members = await Team.getTeamMembers(teamId);

      res.json({
        success: true,
        data: {
          members
        }
      });
    } catch (error) {
      console.error('Get team members error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get team members'
      });
    }
  }

  // Add team member
  static async addTeamMember(req, res) {
    try {
      const { teamId } = req.params;
      const { userId, role = 'member' } = req.body;

      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if user is already a member
      const isMember = await Team.isMember(teamId, userId);
      if (isMember) {
        return res.status(409).json({
          success: false,
          message: 'User is already a team member'
        });
      }

      const membership = await Team.addMember(teamId, userId, role);

      res.status(201).json({
        success: true,
        message: 'Team member added successfully',
        data: {
          membership
        }
      });
    } catch (error) {
      console.error('Add team member error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add team member'
      });
    }
  }

  // Remove team member
  static async removeTeamMember(req, res) {
    try {
      const { teamId, memberId } = req.params;

      const removed = await Team.removeMember(teamId, memberId);
      if (!removed) {
        return res.status(404).json({
          success: false,
          message: 'Team member not found or cannot remove owner'
        });
      }

      res.json({
        success: true,
        message: 'Team member removed successfully'
      });
    } catch (error) {
      console.error('Remove team member error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove team member'
      });
    }
  }

  // Update member role
  static async updateMemberRole(req, res) {
    try {
      const { teamId, memberId } = req.params;
      const { role } = req.body;

      const updatedMembership = await Team.updateMemberRole(teamId, memberId, role);
      if (!updatedMembership) {
        return res.status(404).json({
          success: false,
          message: 'Team member not found or cannot change owner role'
        });
      }

      res.json({
        success: true,
        message: 'Member role updated successfully',
        data: {
          membership: updatedMembership
        }
      });
    } catch (error) {
      console.error('Update member role error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update member role'
      });
    }
  }

  // Get task columns
  static async getTaskColumns(req, res) {
    try {
      const { teamId } = req.params;
      
      const columns = await Team.getTaskColumns(teamId);

      res.json({
        success: true,
        data: {
          columns
        }
      });
    } catch (error) {
      console.error('Get task columns error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get task columns'
      });
    }
  }

  // Create task column
  static async createTaskColumn(req, res) {
    try {
      const { teamId } = req.params;
      const { name, color, position } = req.body;

      const column = await Team.createTaskColumn(teamId, {
        name,
        color,
        position
      });

      res.status(201).json({
        success: true,
        message: 'Task column created successfully',
        data: {
          column
        }
      });
    } catch (error) {
      console.error('Create task column error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create task column'
      });
    }
  }

  // Update task column
  static async updateTaskColumn(req, res) {
    try {
      const { columnId } = req.params;
      const { name, color, position } = req.body;

      const updatedColumn = await Team.updateTaskColumn(columnId, {
        name,
        color,
        position
      });

      if (!updatedColumn) {
        return res.status(404).json({
          success: false,
          message: 'Task column not found'
        });
      }

      res.json({
        success: true,
        message: 'Task column updated successfully',
        data: {
          column: updatedColumn
        }
      });
    } catch (error) {
      console.error('Update task column error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update task column'
      });
    }
  }

  // Delete task column
  static async deleteTaskColumn(req, res) {
    try {
      const { columnId } = req.params;

      const deleted = await Team.deleteTaskColumn(columnId);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Task column not found'
        });
      }

      res.json({
        success: true,
        message: 'Task column deleted successfully'
      });
    } catch (error) {
      console.error('Delete task column error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete task column'
      });
    }
  }

  // Get team stats
  static async getTeamStats(req, res) {
    try {
      const { teamId } = req.params;
      
      const stats = await Team.getTeamStats(teamId);

      res.json({
        success: true,
        data: {
          stats
        }
      });
    } catch (error) {
      console.error('Get team stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get team stats'
      });
    }
  }
}

module.exports = TeamController;