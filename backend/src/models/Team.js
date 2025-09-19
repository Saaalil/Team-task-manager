const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['owner', 'admin', 'member'],
    default: 'member'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
});

const taskColumnSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  position: {
    type: Number,
    required: true
  },
  color: {
    type: String,
    default: '#64748b'
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  color: {
    type: String,
    default: '#3b82f6'
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [teamMemberSchema],
  columns: [taskColumnSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  settings: {
    allowMemberInvites: {
      type: Boolean,
      default: true
    },
    requireApprovalForTasks: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Indexes for performance
teamSchema.index({ ownerId: 1 });
teamSchema.index({ 'members.userId': 1 });
teamSchema.index({ name: 'text', description: 'text' });

// Virtual for member count
teamSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

// Static method to create team with default columns
teamSchema.statics.createTeam = async function(teamData, ownerId) {
  const defaultColumns = [
    { name: 'To Do', position: 0, color: '#ef4444', isDefault: true },
    { name: 'In Progress', position: 1, color: '#f59e0b', isDefault: true },
    { name: 'Done', position: 2, color: '#10b981', isDefault: true }
  ];

  const team = new this({
    ...teamData,
    ownerId,
    members: [{ userId: ownerId, role: 'owner', joinedAt: new Date() }],
    columns: defaultColumns
  });

  return await team.save();
};

// Instance method to add member
teamSchema.methods.addMember = async function(userId, role = 'member') {
  // Check if user is already a member
  const existingMember = this.members.find(
    member => member.userId.toString() === userId.toString()
  );

  if (existingMember) {
    throw new Error('User is already a member of this team');
  }

  this.members.push({ userId, role, joinedAt: new Date() });
  return await this.save();
};

// Instance method to remove member
teamSchema.methods.removeMember = async function(userId) {
  // Cannot remove the owner
  if (this.ownerId.toString() === userId.toString()) {
    throw new Error('Cannot remove team owner');
  }

  this.members = this.members.filter(
    member => member.userId.toString() !== userId.toString()
  );
  
  return await this.save();
};

// Instance method to update member role
teamSchema.methods.updateMemberRole = async function(userId, newRole) {
  // Cannot change owner role
  if (this.ownerId.toString() === userId.toString()) {
    throw new Error('Cannot change owner role');
  }

  const member = this.members.find(
    member => member.userId.toString() === userId.toString()
  );

  if (!member) {
    throw new Error('User is not a member of this team');
  }

  member.role = newRole;
  return await this.save();
};

// Instance method to get team members with user details
teamSchema.methods.getTeamMembers = async function() {
  return await this.populate('members.userId', 'firstName lastName email avatar');
};

// Instance method to check if user is member
teamSchema.methods.isMember = function(userId) {
  return this.members.some(
    member => member.userId.toString() === userId.toString()
  ) || this.ownerId.toString() === userId.toString();
};

// Instance method to get user role
teamSchema.methods.getUserRole = function(userId) {
  if (this.ownerId.toString() === userId.toString()) {
    return 'owner';
  }

  const member = this.members.find(
    member => member.userId.toString() === userId.toString()
  );

  return member ? member.role : null;
};

// Instance method to add column
teamSchema.methods.addColumn = async function(columnData) {
  const maxPosition = this.columns.reduce((max, col) => 
    Math.max(max, col.position), -1
  );

  const newColumn = {
    ...columnData,
    position: maxPosition + 1
  };

  this.columns.push(newColumn);
  return await this.save();
};

// Instance method to update column
teamSchema.methods.updateColumn = async function(columnId, updateData) {
  const column = this.columns.id(columnId);
  if (!column) {
    throw new Error('Column not found');
  }

  Object.assign(column, updateData);
  return await this.save();
};

// Instance method to delete column
teamSchema.methods.deleteColumn = async function(columnId) {
  const column = this.columns.id(columnId);
  if (!column) {
    throw new Error('Column not found');
  }

  if (column.isDefault) {
    throw new Error('Cannot delete default column');
  }

  // Check if column has tasks
  const Task = mongoose.model('Task');
  const tasksInColumn = await Task.countDocuments({
    teamId: this._id,
    columnId: columnId
  });

  if (tasksInColumn > 0) {
    throw new Error('Cannot delete column with tasks');
  }

  this.columns.pull(columnId);
  return await this.save();
};

// Instance method to reorder columns
teamSchema.methods.reorderColumns = async function(columnOrders) {
  columnOrders.forEach(({ columnId, position }) => {
    const column = this.columns.id(columnId);
    if (column) {
      column.position = position;
    }
  });

  // Sort columns by position
  this.columns.sort((a, b) => a.position - b.position);
  
  return await this.save();
};

// Static method to find teams for user
teamSchema.statics.findTeamsForUser = async function(userId) {
  return await this.find({
    $or: [
      { ownerId: userId },
      { 'members.userId': userId }
    ],
    isActive: true
  })
  .populate('ownerId', 'firstName lastName email avatar')
  .populate('members.userId', 'firstName lastName email avatar')
  .sort({ createdAt: -1 });
};

// Transform JSON output
teamSchema.methods.toJSON = function() {
  const team = this.toObject();
  
  // Add virtual fields
  team.memberCount = this.memberCount;
  
  return team;
};

const Team = mongoose.model('Team', teamSchema);

module.exports = Team;