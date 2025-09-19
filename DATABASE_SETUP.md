# Database Setup Guide - Team Task Manager

This guide will walk you through setting up PostgreSQL for the Team Task Manager application.

## Prerequisites

- PostgreSQL 14+ installed on your system
- Administrative access to create databases and users

## Installation Guide

### Windows

1. **Download PostgreSQL**:
   - Go to https://www.postgresql.org/download/windows/
   - Download the installer for your system
   - Run the installer and follow the setup wizard

2. **During installation**:
   - Remember the password you set for the `postgres` superuser
   - Keep the default port (5432)
   - Install pgAdmin (optional but recommended)

3. **Verify installation**:
   ```cmd
   psql --version
   ```

### macOS

1. **Using Homebrew** (recommended):
   ```bash
   brew install postgresql@14
   brew services start postgresql@14
   ```

2. **Or download from official site**:
   - Go to https://www.postgresql.org/download/macosx/
   - Download and install the PostgreSQL installer

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Linux (CentOS/RHEL)

```bash
sudo yum install postgresql-server postgresql-contrib
sudo postgresql-setup initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## Database Configuration

### Step 1: Access PostgreSQL

**Windows:**
```cmd
# Open Command Prompt as Administrator
psql -U postgres
```

**macOS/Linux:**
```bash
sudo -u postgres psql
```

### Step 2: Create Database and User

Once you're in the PostgreSQL command line, run these commands:

```sql
-- Create the database
CREATE DATABASE team_task_manager;

-- Create a dedicated user
CREATE USER task_manager_user WITH ENCRYPTED PASSWORD 'SecurePassword123!';

-- Grant all privileges on the database to the user
GRANT ALL PRIVILEGES ON DATABASE team_task_manager TO task_manager_user;

-- Grant schema permissions
\c team_task_manager;
GRANT ALL ON SCHEMA public TO task_manager_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO task_manager_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO task_manager_user;

-- Exit PostgreSQL
\q
```

### Step 3: Test the Connection

Test that you can connect with the new user:

```bash
psql -h localhost -d team_task_manager -U task_manager_user
```

You should be prompted for the password you set above.

## Configure Application Environment

### Update Backend Environment File

Navigate to your project directory and update the backend environment file:

```bash
cd "/c/Users/HP/Downloads/Speal Genie/team-task-manager"
```

Edit `backend/.env` (create from `.env.example` if it doesn't exist):

```env
# Database Configuration
DATABASE_URL=postgresql://task_manager_user:SecurePassword123!@localhost:5432/team_task_manager
DB_HOST=localhost
DB_PORT=5432
DB_NAME=team_task_manager
DB_USER=task_manager_user
DB_PASSWORD=SecurePassword123!

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

## Run Database Migrations

Once your database is configured, run the migrations to create all the tables:

```bash
# Navigate to backend directory
cd backend

# Install dependencies if not already done
npm install

# Run database migrations
npm run db:migrate
```

You should see output like:
```
🔄 Running database migrations...
✅ Users table created/verified
✅ Teams table created/verified
✅ Team members table created/verified
✅ Task columns table created/verified
✅ Tasks table created/verified
✅ Task comments table created/verified
✅ Team invitations table created/verified
✅ Audit logs table created/verified
✅ Updated at function created/verified
✅ Updated at triggers created/verified
🎉 Database migrations completed successfully!
```

## Seed Sample Data (Optional)

To populate your database with sample data for testing:

```bash
npm run db:seed
```

This will create:
- 4 sample users (including an admin)
- 2 sample teams
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

**1. "psql: command not found"**
- PostgreSQL is not in your PATH
- **Windows**: Add PostgreSQL bin directory to PATH (usually `C:\Program Files\PostgreSQL\14\bin`)
- **macOS**: Install using Homebrew or add to PATH
- **Linux**: Install PostgreSQL using package manager

**2. "connection refused"**
- PostgreSQL service is not running
- **Windows**: Start PostgreSQL service in Services app
- **macOS**: `brew services start postgresql@14`
- **Linux**: `sudo systemctl start postgresql`

**3. "authentication failed"**
- Wrong password or user doesn't exist
- Reset password: `ALTER USER task_manager_user PASSWORD 'NewPassword123!';`

**4. "database does not exist"**
- Database wasn't created properly
- Recreate using the SQL commands above

**5. "permission denied"**
- User doesn't have proper permissions
- Re-run the GRANT commands from Step 2

### Reset Database

If you need to start over:

```sql
-- Connect as postgres superuser
\c postgres;

-- Drop everything and recreate
DROP DATABASE IF EXISTS team_task_manager;
DROP USER IF EXISTS task_manager_user;

-- Then follow Step 2 again
```

### Check Database Status

To verify your setup:

```bash
# Check if PostgreSQL is running
# Windows
sc query postgresql-x64-14

# macOS
brew services list | grep postgresql

# Linux
sudo systemctl status postgresql

# Test connection
psql -h localhost -d team_task_manager -U task_manager_user -c "SELECT current_database();"
```

## Database Schema Overview

After migration, your database will have these tables:

- **users** - User accounts and authentication
- **teams** - Team/workspace information  
- **team_members** - User-team relationships and roles
- **task_columns** - Kanban board columns
- **tasks** - Task/card information
- **task_comments** - Comments on tasks
- **team_invitations** - Pending team invitations
- **audit_logs** - Activity tracking

## Next Steps

1. **Verify the setup** by running the migration
2. **Test the API** by starting the backend server: `npm run dev`
3. **Check the health endpoint**: http://localhost:5000/api/health
4. **Start the full application**: From root directory, run `npm run dev`

Your database is now ready for the Team Task Manager application!