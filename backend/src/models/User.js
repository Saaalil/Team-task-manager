const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId; // Password required only if not Google OAuth user
    }
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  avatar: {
    type: String,
    default: null
  },
  googleId: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  lastLoginAt: {
    type: Date,
    default: null
  },
  refreshTokens: [{
    token: String,
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 604800 // 7 days
    }
  }]
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ googleId: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  if (this.password) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

// Instance method to validate password
userSchema.methods.validatePassword = async function(password) {
  if (!this.password) return false;
  return bcrypt.compare(password, this.password);
};

// Static method to create user
userSchema.statics.createUser = async function(userData) {
  const user = new this({
    ...userData,
    emailVerified: userData.googleId ? true : false // Auto-verify Google users
  });
  return await user.save();
};

// Static method to find by email
userSchema.statics.findByEmail = async function(email) {
  return await this.findOne({ 
    email: email.toLowerCase(),
    isActive: true 
  });
};

// Static method to find by username
userSchema.statics.findByUsername = async function(username) {
  return await this.findOne({ 
    username: username.toLowerCase(),
    isActive: true 
  });
};

// Static method to find by Google ID
userSchema.statics.findByGoogleId = async function(googleId) {
  return await this.findOne({ 
    googleId,
    isActive: true 
  });
};

// Instance method to update last login
userSchema.methods.updateLastLogin = async function() {
  this.lastLoginAt = new Date();
  return await this.save();
};

// Instance method to add refresh token
userSchema.methods.addRefreshToken = async function(token) {
  this.refreshTokens.push({ token });
  
  // Keep only the 5 most recent tokens
  if (this.refreshTokens.length > 5) {
    this.refreshTokens = this.refreshTokens.slice(-5);
  }
  
  return await this.save();
};

// Instance method to remove refresh token
userSchema.methods.removeRefreshToken = async function(token) {
  this.refreshTokens = this.refreshTokens.filter(t => t.token !== token);
  return await this.save();
};

// Instance method to remove all refresh tokens
userSchema.methods.removeAllRefreshTokens = async function() {
  this.refreshTokens = [];
  return await this.save();
};

// Static method to find by refresh token
userSchema.statics.findByRefreshToken = async function(token) {
  return await this.findOne({
    'refreshTokens.token': token,
    isActive: true
  });
};

// Instance method to update profile
userSchema.methods.updateProfile = async function(updateData) {
  const allowedUpdates = ['firstName', 'lastName', 'avatar'];
  allowedUpdates.forEach(field => {
    if (updateData[field] !== undefined) {
      this[field] = updateData[field];
    }
  });
  return await this.save();
};

// Instance method to get user teams
userSchema.methods.getUserTeams = async function() {
  const Team = mongoose.model('Team');
  return await Team.find({
    $or: [
      { 'members.userId': this._id },
      { ownerId: this._id }
    ],
    isActive: true
  })
  .populate('ownerId', 'firstName lastName email avatar')
  .populate('members.userId', 'firstName lastName email avatar')
  .sort({ createdAt: -1 });
};

// Instance method to deactivate user
userSchema.methods.deactivate = async function() {
  this.isActive = false;
  return await this.save();
};

// Transform JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.refreshTokens;
  return user;
};

const User = mongoose.model('User', userSchema);

module.exports = User;