#!/bin/bash

# MongoDB Setup Script for Team Task Manager
# This script helps set up MongoDB database for the application

set -e  # Exit on any error

echo "🗄️  Team Task Manager - MongoDB Setup"
echo "====================================="

# Check if MongoDB is installed
check_mongodb() {
    if ! command -v mongod &> /dev/null && ! command -v mongosh &> /dev/null; then
        echo "❌ MongoDB is not installed or not in PATH"
        echo "Please install MongoDB first:"
        echo "  - Windows: https://www.mongodb.com/try/download/community"
        echo "  - macOS: brew tap mongodb/brew && brew install mongodb-community"
        echo "  - Linux: See MONGODB_SETUP.md for detailed instructions"
        exit 1
    fi
    echo "✅ MongoDB found"
}

# Check if MongoDB service is running
check_mongodb_service() {
    if ! pgrep -x "mongod" > /dev/null; then
        echo "❌ MongoDB service is not running"
        echo "Please start MongoDB service:"
        echo "  - Windows: net start MongoDB"
        echo "  - macOS: brew services start mongodb/brew/mongodb-community"
        echo "  - Linux: sudo systemctl start mongod"
        exit 1
    fi
    echo "✅ MongoDB service is running"
}

# Test MongoDB connection
test_mongodb_connection() {
    echo "🧪 Testing MongoDB connection..."
    
    if command -v mongosh &> /dev/null; then
        if mongosh --eval "db.runCommand({hello: 1})" --quiet &> /dev/null; then
            echo "✅ MongoDB connection successful"
        else
            echo "❌ Cannot connect to MongoDB"
            exit 1
        fi
    elif command -v mongo &> /dev/null; then
        if mongo --eval "db.runCommand({hello: 1})" --quiet &> /dev/null; then
            echo "✅ MongoDB connection successful"
        else
            echo "❌ Cannot connect to MongoDB"
            exit 1
        fi
    else
        echo "⚠️  MongoDB shell not found, assuming connection is working"
    fi
}

# Get database configuration
get_credentials() {
    echo ""
    echo "📝 Database Configuration"
    echo "========================"
    
    read -p "Enter MongoDB connection URI (default: mongodb://localhost:27017/team_task_manager): " MONGODB_URI
    MONGODB_URI=${MONGODB_URI:-mongodb://localhost:27017/team_task_manager}
    
    echo ""
    echo "Selected MongoDB URI: $MONGODB_URI"
    echo ""
}

# Create or update .env file
create_env_file() {
    echo "📄 Creating backend environment file..."
    
    ENV_FILE="backend/.env"
    
    # Generate a random JWT secret
    JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64 || echo "your-super-secret-jwt-key-at-least-32-characters-long-for-security")
    
    cat > $ENV_FILE << EOF
# Backend Environment Variables
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=${MONGODB_URI}
DATABASE_URL=${MONGODB_URI}

# JWT Configuration
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRE=7d

# Google OAuth (optional - get from Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret

# CORS Configuration
FRONTEND_URL=http://localhost:3000

# Socket.io Configuration
SOCKET_CORS_ORIGIN=http://localhost:3000
EOF

    echo "✅ Environment file created at ${ENV_FILE}"
}

# Install dependencies and setup database
setup_database() {
    echo "🔧 Setting up database..."
    
    cd backend
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing backend dependencies..."
        npm install
    fi
    
    # Run database setup (creates indexes)
    echo "🔄 Setting up MongoDB indexes..."
    npm run db:migrate
    
    echo "✅ Database setup completed"
    cd ..
}

# Optional: Seed sample data
seed_database() {
    echo ""
    read -p "Would you like to seed the database with sample data? (y/N): " seed_choice
    
    if [[ $seed_choice =~ ^[Yy]$ ]]; then
        echo "🌱 Seeding database with sample data..."
        cd backend
        npm run db:seed
        echo "✅ Sample data created"
        echo ""
        echo "Sample login credentials:"
        echo "  Admin: admin@taskmanager.com / Admin123!"
        echo "  User:  john@example.com / Password123!"
        cd ..
    fi
}

# Main execution
main() {
    check_mongodb
    check_mongodb_service
    test_mongodb_connection
    get_credentials
    
    echo "🚀 Starting database setup..."
    create_env_file
    setup_database
    seed_database
    
    echo ""
    echo "🎉 MongoDB setup completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Start the backend server: cd backend && npm run dev"
    echo "2. In another terminal, start the frontend: cd frontend && npm start"
    echo "3. Open http://localhost:3000 in your browser"
    echo ""
    echo "Database connection details saved in: backend/.env"
    echo "For more information, see: MONGODB_SETUP.md"
}

# Handle Ctrl+C gracefully
trap 'echo ""; echo "❌ Setup interrupted"; exit 1' INT

# Run main function
main