const mongoose = require('mongoose');

const taskCommentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  editedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  columnId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'archived'],
    default: 'active'
  },
  position: {
    type: Number,
    required: true,
    default: 0
  },
  dueDate: {
    type: Date,
    default: null
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  comments: [taskCommentSchema],
  attachments: [{
    filename: String,
    url: String,
    size: Number,
    mimeType: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  completedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for performance
taskSchema.index({ teamId: 1, columnId: 1, position: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ createdBy: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ status: 1 });

// Virtual for comment count
taskSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Virtual for is overdue
taskSchema.virtual('isOverdue').get(function() {
  return this.dueDate && this.dueDate < new Date() && this.status !== 'completed';
});

// Static method to create task
taskSchema.statics.createTask = async function(taskData, createdBy) {
  // Get the next position in the column
  const maxPosition = await this.findOne({
    teamId: taskData.teamId,
    columnId: taskData.columnId
  }).sort({ position: -1 }).select('position');

  const position = maxPosition ? maxPosition.position + 1 : 0;

  const task = new this({
    ...taskData,
    createdBy,
    position
  });

  return await task.save();
};

// Instance method to move task to different column
taskSchema.methods.moveTask = async function(newColumnId, newPosition) {
  const oldColumnId = this.columnId;
  const oldPosition = this.position;

  // If moving to same column, just reorder
  if (oldColumnId.toString() === newColumnId.toString()) {
    await this.constructor.updateMany(
      {
        teamId: this.teamId,
        columnId: oldColumnId,
        position: { $gte: newPosition },
        _id: { $ne: this._id }
      },
      { $inc: { position: 1 } }
    );
  } else {
    // Moving to different column
    // Decrease positions in old column
    await this.constructor.updateMany(
      {
        teamId: this.teamId,
        columnId: oldColumnId,
        position: { $gt: oldPosition }
      },
      { $inc: { position: -1 } }
    );

    // Increase positions in new column
    await this.constructor.updateMany(
      {
        teamId: this.teamId,
        columnId: newColumnId,
        position: { $gte: newPosition }
      },
      { $inc: { position: 1 } }
    );
  }

  this.columnId = newColumnId;
  this.position = newPosition;
  
  return await this.save();
};

// Instance method to assign users
taskSchema.methods.assignUsers = async function(userIds) {
  this.assignedTo = userIds;
  return await this.save();
};

// Instance method to add comment
taskSchema.methods.addComment = async function(userId, content) {
  this.comments.push({
    userId,
    content
  });
  return await this.save();
};

// Instance method to update comment
taskSchema.methods.updateComment = async function(commentId, content) {
  const comment = this.comments.id(commentId);
  if (!comment) {
    throw new Error('Comment not found');
  }

  comment.content = content;
  comment.editedAt = new Date();
  
  return await this.save();
};

// Instance method to delete comment
taskSchema.methods.deleteComment = async function(commentId) {
  this.comments.pull(commentId);
  return await this.save();
};

// Instance method to mark as completed
taskSchema.methods.markCompleted = async function() {
  this.status = 'completed';
  this.completedAt = new Date();
  return await this.save();
};

// Instance method to reopen task
taskSchema.methods.reopenTask = async function() {
  this.status = 'active';
  this.completedAt = null;
  return await this.save();
};

// Static method to get tasks for team
taskSchema.statics.getTeamTasks = async function(teamId, filters = {}) {
  const query = { teamId, status: 'active' };

  // Apply filters
  if (filters.columnId) {
    query.columnId = filters.columnId;
  }
  
  if (filters.assignedTo) {
    query.assignedTo = { $in: [filters.assignedTo] };
  }
  
  if (filters.priority) {
    query.priority = filters.priority;
  }
  
  if (filters.dueDate) {
    query.dueDate = { $lte: new Date(filters.dueDate) };
  }

  return await this.find(query)
    .populate('assignedTo', 'firstName lastName email avatar')
    .populate('createdBy', 'firstName lastName email avatar')
    .populate('comments.userId', 'firstName lastName email avatar')
    .sort({ position: 1 });
};

// Static method to get user tasks
taskSchema.statics.getUserTasks = async function(userId, filters = {}) {
  const query = { 
    assignedTo: { $in: [userId] },
    status: filters.status || 'active'
  };

  if (filters.teamId) {
    query.teamId = filters.teamId;
  }

  if (filters.priority) {
    query.priority = filters.priority;
  }

  return await this.find(query)
    .populate('teamId', 'name color')
    .populate('createdBy', 'firstName lastName email avatar')
    .populate('assignedTo', 'firstName lastName email avatar')
    .sort({ createdAt: -1 });
};

// Static method to reorder tasks in column
taskSchema.statics.reorderTasks = async function(teamId, columnId, taskOrders) {
  const bulkOps = taskOrders.map(({ taskId, position }) => ({
    updateOne: {
      filter: { _id: taskId, teamId, columnId },
      update: { position }
    }
  }));

  if (bulkOps.length > 0) {
    await this.bulkWrite(bulkOps);
  }
};

// Transform JSON output
taskSchema.methods.toJSON = function() {
  const task = this.toObject();
  
  // Add virtual fields
  task.commentCount = this.commentCount;
  task.isOverdue = this.isOverdue;
  
  return task;
};

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;