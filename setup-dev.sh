#!/bin/bash

# Team Task Manager Development Setup Script

echo "🚀 Setting up Team Task Manager Development Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="18.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    print_error "Node.js version $NODE_VERSION is installed, but version 18+ is required."
    exit 1
fi

print_status "Node.js version $NODE_VERSION detected"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    print_warning "PostgreSQL is not installed or not in PATH. Please install PostgreSQL 14+ and ensure it's running."
    print_warning "You'll need to manually create the database and configure connection settings."
else
    print_status "PostgreSQL detected"
fi

# Install dependencies
print_status "Installing project dependencies..."

if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root directory."
    exit 1
fi

npm install

if [ $? -ne 0 ]; then
    print_error "Failed to install root dependencies"
    exit 1
fi

print_status "Root dependencies installed"

# Install backend dependencies
print_status "Installing backend dependencies..."
cd backend
npm install

if [ $? -ne 0 ]; then
    print_error "Failed to install backend dependencies"
    exit 1
fi

print_status "Backend dependencies installed"

# Install frontend dependencies
print_status "Installing frontend dependencies..."
cd ../frontend

# Check if frontend was already set up
if [ ! -f "package.json" ]; then
    print_error "Frontend package.json not found. Please ensure the React app was created successfully."
    exit 1
fi

npm install

if [ $? -ne 0 ]; then
    print_error "Failed to install frontend dependencies"
    exit 1
fi

print_status "Frontend dependencies installed"

# Go back to root
cd ..

# Create environment files if they don't exist
print_status "Setting up environment files..."

if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    print_status "Created backend/.env from example"
    print_warning "Please update backend/.env with your database credentials and JWT secret"
else
    print_status "Backend .env file already exists"
fi

if [ ! -f "frontend/.env" ]; then
    cp frontend/.env.example frontend/.env
    print_status "Created frontend/.env from example"
else
    print_status "Frontend .env file already exists"
fi

# Final instructions
echo ""
echo "🎉 Development environment setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Configure your PostgreSQL database:"
echo "   - Create database: team_task_manager"
echo "   - Create user with appropriate permissions"
echo "   - Update backend/.env with your database credentials"
echo ""
echo "2. Update backend/.env with a secure JWT secret (min 32 characters)"
echo ""
echo "3. Run database migrations:"
echo "   cd backend && npm run db:migrate"
echo ""
echo "4. (Optional) Seed database with sample data:"
echo "   npm run db:seed"
echo ""
echo "5. Start development servers:"
echo "   npm run dev"
echo ""
echo "🔗 URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:5000"
echo "   API Health: http://localhost:5000/api/health"
echo ""
echo "📚 For detailed setup instructions, see DEVELOPMENT.md"