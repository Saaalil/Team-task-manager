const express = require('express');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const { validateSearch, validateUUID } = require('../middleware/validation');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Search users
router.get('/search', validateSearch, async (req, res) => {
  try {
    const { q: query } = req.query;
    
    if (!query) {
      return res.json({
        success: true,
        data: {
          users: []
        }
      });
    }

    const users = await User.searchUsers(query);

    res.json({
      success: true,
      data: {
        users
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search users'
    });
  }
});

// Get user by ID
router.get('/:userId', validateUUID('userId'), async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove sensitive information
    const { password_hash, ...userInfo } = user;

    res.json({
      success: true,
      data: {
        user: userInfo
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user'
    });
  }
});

// Get user's teams
router.get('/:userId/teams', validateUUID('userId'), async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Users can only view their own teams or public team info
    if (userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

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
      message: 'Failed to get user teams'
    });
  }
});

module.exports = router;