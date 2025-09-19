const User = require('../models/User');
const JWTUtils = require('../utils/jwt');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

class AuthController {
  // User registration
  static async register(req, res) {
    try {
      const { email, username, password, firstName, lastName } = req.body;

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      // Check if username is taken
      const existingUsername = await User.findByUsername(username);
      if (existingUsername) {
        return res.status(409).json({
          success: false,
          message: 'Username is already taken'
        });
      }

      // Create user
      const user = await User.createUser({
        email,
        username,
        password,
        firstName,
        lastName
      });

      // Generate tokens
      const accessToken = JWTUtils.generateAccessToken(user._id);
      const refreshToken = JWTUtils.generateRefreshToken(user._id);

      // Store refresh token
      await user.addRefreshToken(refreshToken);

      // Update last login
      await user.updateLastLogin();

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user._id,
            email: user.email,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: user.fullName,
            avatar: user.avatar,
            emailVerified: user.emailVerified
          },
          accessToken,
          refreshToken
        }
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // User login
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Check if user used Google OAuth (no password set)
      if (!user.password && user.googleId) {
        return res.status(400).json({
          success: false,
          message: 'This account uses Google sign-in. Please use Google OAuth to login.'
        });
      }

      // Validate password
      const isValidPassword = await user.validatePassword(password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Generate tokens
      const accessToken = JWTUtils.generateAccessToken(user._id);
      const refreshToken = JWTUtils.generateRefreshToken(user._id);

      // Store refresh token
      await user.addRefreshToken(refreshToken);

      // Update last login
      await user.updateLastLogin();

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user._id,
            email: user.email,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: user.fullName,
            avatar: user.avatar,
            emailVerified: user.emailVerified
          },
          accessToken,
          refreshToken
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Google OAuth login
  static async googleAuth(req, res) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Google token is required'
        });
      }

      // Verify Google token
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID
      });

      const payload = ticket.getPayload();
      const { sub: googleId, email, given_name: firstName, family_name: lastName, picture: avatar } = payload;

      // Check if user exists with this Google ID
      let user = await User.findByGoogleId(googleId);

      if (!user) {
        // Check if user exists with this email
        user = await User.findByEmail(email);
        
        if (user) {
          // Link Google account to existing user
          user.googleId = googleId;
          user.emailVerified = true;
          if (avatar && !user.avatar) {
            user.avatar = avatar;
          }
          await user.save();
        } else {
          // Create new user with Google OAuth
          const username = email.split('@')[0].toLowerCase() + Math.floor(Math.random() * 1000);
          
          user = await User.createUser({
            email,
            username,
            firstName: firstName || 'User',
            lastName: lastName || '',
            avatar,
            googleId,
            emailVerified: true
          });
        }
      } else {
        // Update avatar if it's changed
        if (avatar && user.avatar !== avatar) {
          user.avatar = avatar;
          await user.save();
        }
      }

      // Generate tokens
      const accessToken = JWTUtils.generateAccessToken(user._id);
      const refreshToken = JWTUtils.generateRefreshToken(user._id);

      // Store refresh token
      await user.addRefreshToken(refreshToken);

      // Update last login
      await user.updateLastLogin();

      res.json({
        success: true,
        message: 'Google authentication successful',
        data: {
          user: {
            id: user._id,
            email: user.email,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: user.fullName,
            avatar: user.avatar,
            emailVerified: user.emailVerified
          },
          accessToken,
          refreshToken
        }
      });

    } catch (error) {
      console.error('Google auth error:', error);
      res.status(500).json({
        success: false,
        message: 'Google authentication failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Refresh access token
  static async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required'
        });
      }

      // Verify refresh token
      const decoded = JWTUtils.verifyRefreshToken(refreshToken);
      if (!decoded) {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token'
        });
      }

      // Find user by refresh token
      const user = await User.findByRefreshToken(refreshToken);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token'
        });
      }

      // Generate new access token
      const accessToken = JWTUtils.generateAccessToken(user._id);

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken
        }
      });

    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(500).json({
        success: false,
        message: 'Token refresh failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Logout
  static async logout(req, res) {
    try {
      const { refreshToken } = req.body;
      const user = req.user; // From auth middleware

      if (refreshToken) {
        // Remove specific refresh token
        await user.removeRefreshToken(refreshToken);
      } else {
        // Remove all refresh tokens
        await user.removeAllRefreshTokens();
      }

      res.json({
        success: true,
        message: 'Logout successful'
      });

    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Logout failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get current user profile
  static async getProfile(req, res) {
    try {
      const user = req.user; // From auth middleware

      res.json({
        success: true,
        data: {
          user: {
            id: user._id,
            email: user.email,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: user.fullName,
            avatar: user.avatar,
            emailVerified: user.emailVerified,
            lastLoginAt: user.lastLoginAt,
            createdAt: user.createdAt
          }
        }
      });

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get profile',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Update user profile
  static async updateProfile(req, res) {
    try {
      const user = req.user; // From auth middleware
      const { firstName, lastName, avatar } = req.body;

      // Update profile
      const updatedUser = await user.updateProfile({
        firstName,
        lastName,
        avatar
      });

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: {
            id: updatedUser._id,
            email: updatedUser.email,
            username: updatedUser.username,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            fullName: updatedUser.fullName,
            avatar: updatedUser.avatar,
            emailVerified: updatedUser.emailVerified
          }
        }
      });

    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Change password
  static async changePassword(req, res) {
    try {
      const user = req.user; // From auth middleware
      const { currentPassword, newPassword } = req.body;

      // Check if user has a password (not Google OAuth user)
      if (!user.password) {
        return res.status(400).json({
          success: false,
          message: 'Cannot change password for Google OAuth accounts'
        });
      }

      // Validate current password
      const isValidPassword = await user.validatePassword(currentPassword);
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Update password
      user.password = newPassword;
      await user.save();

      // Remove all refresh tokens (force re-login)
      await user.removeAllRefreshTokens();

      res.json({
        success: true,
        message: 'Password changed successfully. Please login again.'
      });

    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to change password',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = AuthController;