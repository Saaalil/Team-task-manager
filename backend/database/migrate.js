const { runMigrations } = require('./migrations/001_initial_schema');

// Main migration runner
const migrate = async () => {
  try {
    console.log('🚀 Starting database migration process...');
    console.log('📊 Environment:', process.env.NODE_ENV || 'development');
    
    await runMigrations();
    
    console.log('✅ All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration process failed:', error);
    process.exit(1);
  }
};

// Run migrations if this file is executed directly
if (require.main === module) {
  migrate();
}

module.exports = { migrate };