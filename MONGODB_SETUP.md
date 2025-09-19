# MongoDB Setup Guide - Team Task Manager

This guide will walk you through setting up MongoDB for the Team Task Manager application.

## Prerequisites

- Node.js 18+ installed on your system
- Administrative access to install MongoDB

## Installation Guide

### Windows

1. **Download MongoDB Community Server**:
   - Go to https://www.mongodb.com/try/download/community
   - Select "Windows" and download the installer
   - Run the installer and follow the setup wizard

2. **During installation**:
   - Choose "Complete" installation
   - Install MongoDB as a Service (recommended)
   - Install MongoDB Compass (optional GUI tool)

3. **Verify installation**:
   ```cmd
   mongod --version
   mongo --version
   ```

### macOS

1. **Using Homebrew** (recommended):
   ```bash
   # Install MongoDB
   brew tap mongodb/brew
   brew install mongodb-community

   # Start MongoDB service
   brew services start mongodb/brew/mongodb-community
   ```

2. **Or download from official site**:
   - Go to https://www.mongodb.com/try/download/community
   - Download and install the MongoDB Community Server

### Linux (Ubuntu/Debian)

```bash
# Import the public key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Add the MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update package database
sudo apt-get update

# Install MongoDB
sudo apt-get install -y mongodb-org

# Start MongoDB service
sudo systemctl start mongod
sudo systemctl enable mongod
```

### Linux (CentOS/RHEL)

```bash
# Create repository file
sudo tee /etc/yum.repos.d/mongodb-org-7.0.repo << EOF
[mongodb-org-7.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/9/mongodb-org/7.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-7.0.asc
EOF

# Install MongoDB
sudo yum install -y mongodb-org

# Start MongoDB service
sudo systemctl start mongod
sudo systemctl enable mongod
```

## Database Configuration

### Step 1: Start MongoDB Service

**Windows:**
- MongoDB should start automatically if installed as a service
- Or manually start: `net start MongoDB`

**macOS:**
```bash
brew services start mongodb/brew/mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
```

### Step 2: Connect to MongoDB

Test that MongoDB is running:

```bash
# Using MongoDB shell (if installed)
mongosh

# Or using the legacy mongo shell
mongo
```

You should see the MongoDB shell prompt.

### Step 3: Create Database and User (Optional)

For production security, create a dedicated user:

```javascript
// In MongoDB shell
use team_task_manager

// Create application user
db.createUser({
  user: "task_manager_user",
  pwd: "SecurePassword123!",
  roles: [
    { role: "readWrite", db: "team_task_manager" }
  ]
})

// Exit MongoDB shell
exit
```

## Configure Application Environment

### Update Backend Environment File

Navigate to your project directory and update the backend environment file:

```bash
cd "/c/Users/HP/Downloads/Speal Genie/team-task-manager"
```

Edit `backend/.env` (create from `.env.example` if it doesn't exist):

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/team_task_manager
DATABASE_URL=mongodb://localhost:27017/team_task_manager

# For authenticated connection (if you created a user):
# MONGODB_URI=mongodb://task_manager_user:SecurePassword123!@localhost:27017/team_task_manager
# DATABASE_URL=mongodb://task_manager_user:SecurePassword123!@localhost:27017/team_task_manager

# JWT Configuration (generate a secure secret)
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long-for-security
JWT_EXPIRE=7d

# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
SOCKET_CORS_ORIGIN=http://localhost:3000

# Google OAuth (optional - get from Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
```

## Run Database Setup

Once your database is configured, run the setup to create indexes:

```bash
# Navigate to backend directory
cd backend

# Install dependencies if not already done
npm install

# Run database setup (creates indexes)
npm run db:migrate
```

You should see output like:
```
🔄 Connecting to MongoDB...
✅ Connected to MongoDB successfully
🔄 Creating database indexes...
✅ Database indexes created successfully
🎉 Database setup completed successfully!
```

## Seed Sample Data (Optional)

To populate your database with sample data for testing:

```bash
npm run db:seed
```

This will create:
- 4 sample users (including an admin)
- 2 sample teams with members
- Sample tasks and comments
- Default task columns (To Do, In Progress, Done)

### Sample Login Credentials

After seeding, you can log in with:

```
Admin User:
Email: admin@taskmanager.com
Password: Admin123!

Regular Users:
Email: john@example.com
Password: Password123!

Email: jane@example.com  
Password: Password123!

Email: mike@example.com
Password: Password123!
```

## Troubleshooting

### Common Issues

**1. "mongod: command not found"**
- MongoDB is not in your PATH
- **Windows**: Add MongoDB bin directory to PATH (usually `C:\Program Files\MongoDB\Server\7.0\bin`)
- **macOS**: Install using Homebrew or add to PATH
- **Linux**: Install MongoDB using package manager

**2. "connection refused"**
- MongoDB service is not running
- **Windows**: Start MongoDB service in Services app or `net start MongoDB`
- **macOS**: `brew services start mongodb/brew/mongodb-community`
- **Linux**: `sudo systemctl start mongod`

**3. "authentication failed"**
- Wrong credentials in connection string
- Make sure MONGODB_URI matches your user credentials

**4. "database does not exist"**
- Database will be created automatically when you first write data
- No need to manually create it

**5. "permission denied"**
- Check MongoDB data directory permissions
- **Linux**: `sudo chown -R mongodb:mongodb /var/lib/mongodb`

### Reset Database

If you need to start over:

```javascript
// In MongoDB shell
use team_task_manager
db.dropDatabase()
```

Or delete specific collections:
```javascript
db.users.drop()
db.teams.drop()
db.tasks.drop()
```

### Check Database Status

To verify your setup:

```bash
# Check if MongoDB is running
# Windows
sc query MongoDB

# macOS
brew services list | grep mongodb

# Linux
sudo systemctl status mongod

# Test connection
mongosh --eval "db.runCommand({hello: 1})"
```

## Database Schema Overview

After seeding, your database will have these collections:

- **users** - User accounts and authentication
- **teams** - Team/workspace information with embedded members and task columns
- **tasks** - Task/card information with embedded comments

The MongoDB schema uses embedded documents for related data like team members, task columns, and comments, which provides better performance for read operations.

## MongoDB Compass (Optional GUI)

If you installed MongoDB Compass, you can:

1. **Open MongoDB Compass**
2. **Connect** using: `mongodb://localhost:27017`
3. **Browse** your `team_task_manager` database
4. **View and edit** documents visually

## Next Steps

1. **Verify the setup** by running the database setup script
2. **Test the API** by starting the backend server: `npm run dev`
3. **Check the health endpoint**: http://localhost:5000/api/health
4. **Start the full application**: From root directory, run `npm run dev`

Your MongoDB database is now ready for the Team Task Manager application!