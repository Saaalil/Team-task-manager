const JWTUtils = require('./jwt');
const User = require('../models/User');
const Team = require('../models/Team');

// Store active connections
const activeUsers = new Map();
const teamRooms = new Map();

const socketHandler = (io) => {
  // Middleware for socket authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = JWTUtils.verifyToken(token);
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.userId = user.id;
      socket.user = user;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.user.username} (${socket.userId}) connected`);

    // Store user connection
    activeUsers.set(socket.userId, {
      socketId: socket.id,
      user: socket.user,
      connectedAt: new Date()
    });

    // Join user to their teams
    socket.on('join-teams', async () => {
      try {
        const userTeams = await User.getUserTeams(socket.userId);
        
        for (const team of userTeams) {
          const roomName = `team:${team.id}`;
          socket.join(roomName);
          
          // Track team members
          if (!teamRooms.has(team.id)) {
            teamRooms.set(team.id, new Set());
          }
          teamRooms.get(team.id).add(socket.userId);
          
          // Notify team members of user's presence
          socket.to(roomName).emit('user:joined', {
            userId: socket.userId,
            username: socket.user.username,
            avatarUrl: socket.user.avatar_url
          });
        }

        socket.emit('teams:joined', {
          teams: userTeams.map(team => team.id)
        });
      } catch (error) {
        console.error('Join teams error:', error);
        socket.emit('error', { message: 'Failed to join teams' });
      }
    });

    // Join specific team room
    socket.on('join-team', async (teamId) => {
      try {
        // Verify user is a member of the team
        const isMember = await Team.isMember(teamId, socket.userId);
        
        if (!isMember) {
          socket.emit('error', { message: 'Not authorized to join this team' });
          return;
        }

        const roomName = `team:${teamId}`;
        socket.join(roomName);
        
        // Track team members
        if (!teamRooms.has(teamId)) {
          teamRooms.set(teamId, new Set());
        }
        teamRooms.get(teamId).add(socket.userId);

        // Notify team members
        socket.to(roomName).emit('user:joined', {
          userId: socket.userId,
          username: socket.user.username,
          avatarUrl: socket.user.avatar_url
        });

        // Send current team members to the user
        const teamMembers = Array.from(teamRooms.get(teamId) || [])
          .map(userId => activeUsers.get(userId))
          .filter(Boolean)
          .map(connection => ({
            userId: connection.user.id,
            username: connection.user.username,
            avatarUrl: connection.user.avatar_url
          }));

        socket.emit('team:members', { teamId, members: teamMembers });
      } catch (error) {
        console.error('Join team error:', error);
        socket.emit('error', { message: 'Failed to join team' });
      }
    });

    // Leave team room
    socket.on('leave-team', (teamId) => {
      const roomName = `team:${teamId}`;
      socket.leave(roomName);
      
      // Remove from team tracking
      if (teamRooms.has(teamId)) {
        teamRooms.get(teamId).delete(socket.userId);
        
        // Clean up empty team rooms
        if (teamRooms.get(teamId).size === 0) {
          teamRooms.delete(teamId);
        }
      }

      // Notify team members
      socket.to(roomName).emit('user:left', {
        userId: socket.userId,
        username: socket.user.username
      });
    });

    // Real-time task updates
    socket.on('task:update', (data) => {
      const { teamId, taskId, updates } = data;
      const roomName = `team:${teamId}`;
      
      // Broadcast to other team members
      socket.to(roomName).emit('task:updated', {
        taskId,
        updates,
        updatedBy: {
          userId: socket.userId,
          username: socket.user.username
        }
      });
    });

    // Real-time task movement
    socket.on('task:move', (data) => {
      const { teamId, taskId, columnId, position } = data;
      const roomName = `team:${teamId}`;
      
      // Broadcast to other team members
      socket.to(roomName).emit('task:moved', {
        taskId,
        columnId,
        position,
        movedBy: {
          userId: socket.userId,
          username: socket.user.username
        }
      });
    });

    // Real-time typing indicators
    socket.on('task:typing', (data) => {
      const { teamId, taskId, isTyping } = data;
      const roomName = `team:${teamId}`;
      
      socket.to(roomName).emit('task:typing', {
        taskId,
        isTyping,
        user: {
          userId: socket.userId,
          username: socket.user.username
        }
      });
    });

    // Real-time cursor position (for collaborative editing)
    socket.on('cursor:move', (data) => {
      const { teamId, taskId, position } = data;
      const roomName = `team:${teamId}`;
      
      socket.to(roomName).emit('cursor:moved', {
        taskId,
        position,
        user: {
          userId: socket.userId,
          username: socket.user.username,
          avatarUrl: socket.user.avatar_url
        }
      });
    });

    // Handle user status updates
    socket.on('user:status', (status) => {
      const connection = activeUsers.get(socket.userId);
      if (connection) {
        connection.status = status;
        
        // Broadcast status to all teams the user is in
        for (const [teamId, members] of teamRooms) {
          if (members.has(socket.userId)) {
            socket.to(`team:${teamId}`).emit('user:status:changed', {
              userId: socket.userId,
              status
            });
          }
        }
      }
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`User ${socket.user.username} (${socket.userId}) disconnected: ${reason}`);
      
      // Remove from active users
      activeUsers.delete(socket.userId);
      
      // Remove from all team rooms and notify
      for (const [teamId, members] of teamRooms) {
        if (members.has(socket.userId)) {
          members.delete(socket.userId);
          
          const roomName = `team:${teamId}`;
          socket.to(roomName).emit('user:left', {
            userId: socket.userId,
            username: socket.user.username
          });
          
          // Clean up empty team rooms
          if (members.size === 0) {
            teamRooms.delete(teamId);
          }
        }
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Send welcome message
    socket.emit('connected', {
      message: 'Connected to Team Task Manager',
      userId: socket.userId,
      username: socket.user.username
    });
  });

  // Helper function to get online team members
  const getOnlineTeamMembers = (teamId) => {
    const members = teamRooms.get(teamId) || new Set();
    return Array.from(members).map(userId => {
      const connection = activeUsers.get(userId);
      return connection ? {
        userId: connection.user.id,
        username: connection.user.username,
        avatarUrl: connection.user.avatar_url,
        status: connection.status || 'online'
      } : null;
    }).filter(Boolean);
  };

  // Helper function to broadcast to team
  const broadcastToTeam = (teamId, event, data) => {
    io.to(`team:${teamId}`).emit(event, data);
  };

  // Helper function to get active user count
  const getActiveUserCount = () => activeUsers.size;

  // Helper function to get team member count
  const getTeamMemberCount = (teamId) => {
    return teamRooms.get(teamId)?.size || 0;
  };

  // Attach helper functions to io object for use in controllers
  io.getOnlineTeamMembers = getOnlineTeamMembers;
  io.broadcastToTeam = broadcastToTeam;
  io.getActiveUserCount = getActiveUserCount;
  io.getTeamMemberCount = getTeamMemberCount;

  console.log('Socket.io server initialized');
};

module.exports = socketHandler;