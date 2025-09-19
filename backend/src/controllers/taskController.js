const Task = require('../models/Task');
const Team = require('../models/Team');

class TaskController {
  // Get all tasks for a team
  static async getTeamTasks(req, res) {
    try {
      const { teamId } = req.params;
      
      const tasks = await Task.getTeamTasks(teamId);

      res.json({
        success: true,
        data: {
          tasks
        }
      });
    } catch (error) {
      console.error('Get team tasks error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get tasks'
      });
    }
  }

  // Get task by ID
  static async getTask(req, res) {
    try {
      const { taskId } = req.params;
      
      const task = await Task.findById(taskId);
      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      // Get task comments
      const comments = await Task.getTaskComments(taskId);

      res.json({
        success: true,
        data: {
          task: {
            ...task,
            comments
          }
        }
      });
    } catch (error) {
      console.error('Get task error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get task'
      });
    }
  }

  // Create new task
  static async createTask(req, res) {
    try {
      const { teamId } = req.params;
      const { title, description, columnId, assignedTo, priority, dueDate } = req.body;
      const createdBy = req.user.id;

      // Verify column belongs to the team
      const columns = await Team.getTaskColumns(teamId);
      const validColumn = columns.find(col => col.id === columnId);
      
      if (!validColumn) {
        return res.status(400).json({
          success: false,
          message: 'Invalid column ID for this team'
        });
      }

      // If assignedTo is provided, verify they are a team member
      if (assignedTo) {
        const isMember = await Team.isMember(teamId, assignedTo);
        if (!isMember) {
          return res.status(400).json({
            success: false,
            message: 'Assigned user is not a team member'
          });
        }
      }

      const task = await Task.create({
        title,
        description,
        teamId,
        columnId,
        assignedTo,
        createdBy,
        priority,
        dueDate
      });

      // Emit socket event for real-time updates
      if (req.io) {
        req.io.to(`team:${teamId}`).emit('task:created', task);
      }

      res.status(201).json({
        success: true,
        message: 'Task created successfully',
        data: {
          task
        }
      });
    } catch (error) {
      console.error('Create task error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create task'
      });
    }
  }

  // Update task
  static async updateTask(req, res) {
    try {
      const { taskId } = req.params;
      const { title, description, assignedTo, priority, status, dueDate } = req.body;

      // Get current task to verify it exists and get team info
      const currentTask = await Task.findById(taskId);
      if (!currentTask) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      // If assignedTo is provided, verify they are a team member
      if (assignedTo) {
        const isMember = await Team.isMember(currentTask.team_id, assignedTo);
        if (!isMember) {
          return res.status(400).json({
            success: false,
            message: 'Assigned user is not a team member'
          });
        }
      }

      const updatedTask = await Task.update(taskId, {
        title,
        description,
        assignedTo,
        priority,
        status,
        dueDate
      });

      // Emit socket event for real-time updates
      if (req.io) {
        req.io.to(`team:${currentTask.team_id}`).emit('task:updated', updatedTask);
      }

      res.json({
        success: true,
        message: 'Task updated successfully',
        data: {
          task: updatedTask
        }
      });
    } catch (error) {
      console.error('Update task error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update task'
      });
    }
  }

  // Move task (drag and drop)
  static async moveTask(req, res) {
    try {
      const { taskId } = req.params;
      const { columnId, position } = req.body;

      // Get current task to verify it exists and get team info
      const currentTask = await Task.findById(taskId);
      if (!currentTask) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      // Verify new column belongs to the same team
      const columns = await Team.getTaskColumns(currentTask.team_id);
      const validColumn = columns.find(col => col.id === columnId);
      
      if (!validColumn) {
        return res.status(400).json({
          success: false,
          message: 'Invalid column ID for this team'
        });
      }

      const movedTask = await Task.moveTask(taskId, columnId, position);

      // Emit socket event for real-time updates
      if (req.io) {
        req.io.to(`team:${currentTask.team_id}`).emit('task:moved', {
          taskId,
          columnId,
          position,
          task: movedTask
        });
      }

      res.json({
        success: true,
        message: 'Task moved successfully',
        data: {
          task: movedTask
        }
      });
    } catch (error) {
      console.error('Move task error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to move task'
      });
    }
  }

  // Delete task
  static async deleteTask(req, res) {
    try {
      const { taskId } = req.params;

      // Get current task to get team info for socket emission
      const currentTask = await Task.findById(taskId);
      if (!currentTask) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      const deleted = await Task.delete(taskId);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      // Emit socket event for real-time updates
      if (req.io) {
        req.io.to(`team:${currentTask.team_id}`).emit('task:deleted', {
          taskId,
          columnId: currentTask.column_id
        });
      }

      res.json({
        success: true,
        message: 'Task deleted successfully'
      });
    } catch (error) {
      console.error('Delete task error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete task'
      });
    }
  }

  // Get user's assigned tasks
  static async getUserTasks(req, res) {
    try {
      const userId = req.user.id;
      const { teamId } = req.query;
      
      const tasks = await Task.getUserTasks(userId, teamId);

      res.json({
        success: true,
        data: {
          tasks
        }
      });
    } catch (error) {
      console.error('Get user tasks error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user tasks'
      });
    }
  }

  // Get task comments
  static async getTaskComments(req, res) {
    try {
      const { taskId } = req.params;
      
      const comments = await Task.getTaskComments(taskId);

      res.json({
        success: true,
        data: {
          comments
        }
      });
    } catch (error) {
      console.error('Get task comments error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get task comments'
      });
    }
  }

  // Add task comment
  static async addTaskComment(req, res) {
    try {
      const { taskId } = req.params;
      const { content } = req.body;
      const userId = req.user.id;

      // Verify task exists and get team info
      const task = await Task.findById(taskId);
      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      const comment = await Task.addComment(taskId, userId, content);

      // Get comment with user details
      const comments = await Task.getTaskComments(taskId);
      const newComment = comments.find(c => c.id === comment.id);

      // Emit socket event for real-time updates
      if (req.io) {
        req.io.to(`team:${task.team_id}`).emit('task:comment:added', {
          taskId,
          comment: newComment
        });
      }

      res.status(201).json({
        success: true,
        message: 'Comment added successfully',
        data: {
          comment: newComment
        }
      });
    } catch (error) {
      console.error('Add task comment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add comment'
      });
    }
  }

  // Update task comment
  static async updateTaskComment(req, res) {
    try {
      const { commentId } = req.params;
      const { content } = req.body;

      const updatedComment = await Task.updateComment(commentId, content);
      if (!updatedComment) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }

      res.json({
        success: true,
        message: 'Comment updated successfully',
        data: {
          comment: updatedComment
        }
      });
    } catch (error) {
      console.error('Update task comment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update comment'
      });
    }
  }

  // Delete task comment
  static async deleteTaskComment(req, res) {
    try {
      const { commentId } = req.params;

      const deleted = await Task.deleteComment(commentId);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }

      res.json({
        success: true,
        message: 'Comment deleted successfully'
      });
    } catch (error) {
      console.error('Delete task comment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete comment'
      });
    }
  }

  // Get task statistics for a team
  static async getTaskStats(req, res) {
    try {
      const { teamId } = req.params;
      
      const stats = await Task.getTaskStats(teamId);

      res.json({
        success: true,
        data: {
          stats
        }
      });
    } catch (error) {
      console.error('Get task stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get task stats'
      });
    }
  }
}

module.exports = TaskController;