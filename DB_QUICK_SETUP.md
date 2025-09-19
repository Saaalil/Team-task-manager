# Quick MongoDB Setup Reference

## Quick Start (Choose one method)

### Option 1: Automated Setup Script (Recommended)

**Windows:**
```cmd
setup-mongodb.bat
```

**macOS/Linux:**
```bash
./setup-mongodb.sh
```

### Option 2: Manual Setup

1. **Install MongoDB** (if not already installed)
   - Windows: Download from https://www.mongodb.com/try/download/community
   - macOS: `brew tap mongodb/brew && brew install mongodb-community`
   - Linux: See MONGODB_SETUP.md for detailed instructions

2. **Start MongoDB Service**
   - Windows: `net start MongoDB`
   - macOS: `brew services start mongodb/brew/mongodb-community`
   - Linux: `sudo systemctl start mongod`

3. **Configure Environment**
   ```bash
   # Copy example environment file
   cp backend/.env.example backend/.env
   
   # Edit backend/.env with your MongoDB URI
   ```

4. **Setup Database**
   ```bash
   cd backend
   npm install
   npm run db:migrate
   
   # Optional: Add sample data
   npm run db:seed
   ```

## Environment Variables Required

```env
MONGODB_URI=mongodb://localhost:27017/team_task_manager
DATABASE_URL=mongodb://localhost:27017/team_task_manager
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
```

## Verify Setup

1. **Test MongoDB Connection:**
   ```bash
   mongosh --eval "db.runCommand({hello: 1})"
   ```

2. **Check Collections Created:**
   ```javascript
   // In mongosh
   use team_task_manager
   show collections
   ```

3. **Start Application:**
   ```bash
   # Backend
   cd backend && npm run dev
   
   # Frontend (new terminal)
   cd frontend && npm start
   ```

## Troubleshooting

- **MongoDB not found**: Add MongoDB bin directory to PATH
- **Service not running**: Start MongoDB service
- **Connection refused**: Check if MongoDB is running on port 27017
- **Permission denied**: Check MongoDB data directory permissions

## Sample Login (after seeding)

- **Admin**: admin@taskmanager.com / Admin123!
- **User**: john@example.com / Password123!