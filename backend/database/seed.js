const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../src/models/User');
const Team = require('../src/models/Team');
const Task = require('../src/models/Task');

async function seedDatabase() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/team_task_manager';
    await mongoose.connect(mongoUri);
    console.log('🌱 Connected to MongoDB for seeding...');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await Task.deleteMany({});
    await Team.deleteMany({});
    await User.deleteMany({});

    console.log('👥 Creating sample users...');
    
    // Create admin user
    const adminUser = await User.createUser({
      email: 'admin@taskmanager.com',
      username: 'admin',
      password: 'Admin123!',
      firstName: 'Admin',
      lastName: 'User',
      emailVerified: true
    });
    console.log('✅ Created admin user');

    // Create team members
    const johnUser = await User.createUser({
      email: 'john@example.com',
      username: 'john_doe',
      password: 'Password123!',
      firstName: 'John',
      lastName: 'Doe',
      emailVerified: true
    });

    const janeUser = await User.createUser({
      email: 'jane@example.com',
      username: 'jane_smith',
      password: 'Password123!',
      firstName: 'Jane',
      lastName: 'Smith',
      emailVerified: true
    });

    const mikeUser = await User.createUser({
      email: 'mike@example.com',
      username: 'mike_johnson',
      password: 'Password123!',
      firstName: 'Mike',
      lastName: 'Johnson',
      emailVerified: true
    });

    console.log('✅ Created 4 sample users');

    // Create sample teams
    console.log('🏗️ Creating sample teams...');
    
    const team1 = await Team.createTeam({
      name: 'Development Team',
      description: 'Main development team for the project',
      color: '#3b82f6'
    }, adminUser._id);

    const team2 = await Team.createTeam({
      name: 'Marketing Team',
      description: 'Team responsible for marketing and outreach',
      color: '#10b981'
    }, janeUser._id);

    console.log('✅ Created 2 sample teams with default columns');

    // Add members to teams
    console.log('👥 Adding members to teams...');
    
    await team1.addMember(johnUser._id, 'admin');
    await team1.addMember(janeUser._id, 'member');
    await team1.addMember(mikeUser._id, 'member');

    await team2.addMember(adminUser._id, 'member');
    await team2.addMember(mikeUser._id, 'admin');

    console.log('✅ Added members to teams');

    // Get column IDs for task creation
    const team1Columns = team1.columns;
    const team2Columns = team2.columns;

    const todoCol1 = team1Columns.find(col => col.name === 'To Do')._id;
    const inProgressCol1 = team1Columns.find(col => col.name === 'In Progress')._id;
    const doneCol1 = team1Columns.find(col => col.name === 'Done')._id;

    const todoCol2 = team2Columns.find(col => col.name === 'To Do')._id;
    const inProgressCol2 = team2Columns.find(col => col.name === 'In Progress')._id;

    // Create sample tasks for Development Team
    console.log('📋 Creating sample tasks...');
    
    const task1 = await Task.createTask({
      title: 'Set up project repository',
      description: 'Initialize the Git repository and set up the basic project structure',
      teamId: team1._id,
      columnId: doneCol1,
      priority: 'high',
      assignedTo: [adminUser._id],
      tags: ['setup', 'git'],
      dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
    }, adminUser._id);

    const task2 = await Task.createTask({
      title: 'Design database schema',
      description: 'Create the database schema for users, teams, and tasks',
      teamId: team1._id,
      columnId: inProgressCol1,
      priority: 'high',
      assignedTo: [johnUser._id, adminUser._id],
      tags: ['database', 'schema'],
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // Day after tomorrow
    }, adminUser._id);

    const task3 = await Task.createTask({
      title: 'Implement user authentication',
      description: 'Build JWT-based authentication system with login and registration',
      teamId: team1._id,
      columnId: todoCol1,
      priority: 'medium',
      assignedTo: [janeUser._id],
      tags: ['auth', 'security', 'jwt']
    }, adminUser._id);

    const task4 = await Task.createTask({
      title: 'Create task management API',
      description: 'Develop REST endpoints for CRUD operations on tasks',
      teamId: team1._id,
      columnId: todoCol1,
      priority: 'medium',
      assignedTo: [mikeUser._id, johnUser._id],
      tags: ['api', 'backend']
    }, adminUser._id);

    const task5 = await Task.createTask({
      title: 'Build frontend components',
      description: 'Create React components for the task management interface',
      teamId: team1._id,
      columnId: todoCol1,
      priority: 'low',
      assignedTo: [janeUser._id],
      tags: ['frontend', 'react', 'ui']
    }, adminUser._id);

    // Create sample tasks for Marketing Team
    const task6 = await Task.createTask({
      title: 'Create marketing strategy',
      description: 'Develop comprehensive marketing strategy for product launch',
      teamId: team2._id,
      columnId: inProgressCol2,
      priority: 'high',
      assignedTo: [janeUser._id],
      tags: ['strategy', 'launch'],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next week
    }, janeUser._id);

    const task7 = await Task.createTask({
      title: 'Design promotional materials',
      description: 'Create banners, flyers, and digital assets for marketing',
      teamId: team2._id,
      columnId: todoCol2,
      priority: 'medium',
      assignedTo: [mikeUser._id],
      tags: ['design', 'materials']
    }, janeUser._id);

    console.log('✅ Created 7 sample tasks');

    // Add some comments to tasks
    console.log('💬 Adding sample comments...');
    
    await task1.addComment(johnUser._id, 'Great job setting this up! The structure looks clean.');
    await task1.addComment(adminUser._id, 'Thanks! I tried to follow best practices.');

    await task2.addComment(adminUser._id, 'I\'ve started working on the user and team models. Should have the initial schema ready by tomorrow.');
    await task2.addComment(johnUser._id, 'Sounds good. I\'ll review it once you\'re done.');

    await task6.addComment(mikeUser._id, 'Do we have the budget numbers for the marketing campaign?');
    await task6.addComment(janeUser._id, 'Yes, I\'ll include them in the strategy document.');

    console.log('✅ Added sample comments to tasks');

    console.log('🎉 Database seeding completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   • ${await User.countDocuments()} users created`);
    console.log(`   • ${await Team.countDocuments()} teams created`);
    console.log(`   • ${await Task.countDocuments()} tasks created`);
    console.log('');
    console.log('🔑 Sample Login Credentials:');
    console.log('   Admin: admin@taskmanager.com / Admin123!');
    console.log('   User:  john@example.com / Password123!');
    console.log('   User:  jane@example.com / Password123!');
    console.log('   User:  mike@example.com / Password123!');

  } catch (error) {
    console.error('❌ Database seeding failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run seeding
seedDatabase();