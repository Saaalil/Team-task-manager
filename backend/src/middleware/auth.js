const JWTUtils = require('../utils/jwt');
const User = require('../models/User');

// Middleware to authenticate JWT tokens
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const token = JWTUtils.extractTokenFromHeader(authHeader);
    const decoded = JWTUtils.verifyToken(token);
    
    // Get fresh user data to ensure user still exists and is active
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    
    if (error.message.includes('expired')) {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Optional authentication - continues even if no token provided
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      req.user = null;
      return next();
    }

    const token = JWTUtils.extractTokenFromHeader(authHeader);
    const decoded = JWTUtils.verifyToken(token);
    
    const user = await User.findById(decoded.id);
    req.user = user || null;
    
    next();
  } catch (error) {
    // Continue without authentication on error
    req.user = null;
    next();
  }
};

// Middleware to check if user has required role in a team
const requireTeamRole = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      const { teamId } = req.params;
      const userId = req.user.id;

      if (!teamId) {
        return res.status(400).json({
          success: false,
          message: 'Team ID required'
        });
      }

      const Team = require('../models/Team');
      const userRole = await Team.getUserRole(teamId, userId);

      if (!userRole) {
        return res.status(403).json({
          success: false,
          message: 'You are not a member of this team'
        });
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
      }

      req.userRole = userRole;
      req.teamId = teamId;
      next();
    } catch (error) {
      console.error('Team role middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking team permissions'
      });
    }
  };
};

// Middleware to check if user is team member (any role)
const requireTeamMembership = requireTeamRole([]);

// Middleware to check if user is team admin or owner
const requireTeamAdmin = requireTeamRole(['owner', 'admin']);

// Middleware to check if user is team owner
const requireTeamOwner = requireTeamRole(['owner']);

module.exports = {
  authenticateToken,
  optionalAuth,
  requireTeamRole,
  requireTeamMembership,
  requireTeamAdmin,
  requireTeamOwner
};