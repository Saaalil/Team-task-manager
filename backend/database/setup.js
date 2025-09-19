const mongoose = require('mongoose');
require('dotenv').config();

async function setupDatabase() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/team_task_manager';
    
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB successfully');

    // Create indexes for performance
    console.log('🔄 Creating database indexes...');
    
    const User = require('../src/models/User');
    const Team = require('../src/models/Team');
    const Task = require('../src/models/Task');

    // Ensure indexes are created
    await User.createIndexes();
    await Team.createIndexes();
    await Task.createIndexes();

    console.log('✅ Database indexes created successfully');

    console.log('🎉 Database setup completed successfully!');
    
    // Display connection info
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`🌐 Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run setup
setupDatabase();