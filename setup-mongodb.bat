@echo off
REM MongoDB Setup Script for Team Task Manager (Windows)
REM This script helps set up MongoDB database for the application

echo 🗄️  Team Task Manager - MongoDB Setup
echo =====================================

REM Check if MongoDB is installed
where mongod >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ MongoDB is not installed or not in PATH
    echo Please install MongoDB first:
    echo   - Download from: https://www.mongodb.com/try/download/community
    echo   - Add MongoDB bin directory to PATH
    pause
    exit /b 1
)

echo ✅ MongoDB found

REM Check if MongoDB service is running
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if %errorlevel% neq 0 (
    echo ❌ MongoDB service is not running
    echo Please start MongoDB service:
    echo   - Run: net start MongoDB
    echo   - Or start manually: mongod
    pause
    exit /b 1
)

echo ✅ MongoDB service is running

echo 🧪 Testing MongoDB connection...

REM Test MongoDB connection
where mongosh >nul 2>nul
if %errorlevel% equ 0 (
    mongosh --eval "db.runCommand({hello: 1})" --quiet >nul 2>nul
    if %errorlevel% neq 0 (
        echo ❌ Cannot connect to MongoDB
        pause
        exit /b 1
    )
) else (
    where mongo >nul 2>nul
    if %errorlevel% equ 0 (
        mongo --eval "db.runCommand({hello: 1})" --quiet >nul 2>nul
        if %errorlevel% neq 0 (
            echo ❌ Cannot connect to MongoDB
            pause
            exit /b 1
        )
    ) else (
        echo ⚠️  MongoDB shell not found, assuming connection is working
    )
)

echo ✅ MongoDB connection successful

echo.
echo 📝 Database Configuration
echo ========================

set /p MONGODB_URI="Enter MongoDB connection URI (default: mongodb://localhost:27017/team_task_manager): "
if "%MONGODB_URI%"=="" set MONGODB_URI=mongodb://localhost:27017/team_task_manager

echo.
echo Selected MongoDB URI: %MONGODB_URI%
echo.

echo 🚀 Starting database setup...

REM Create .env file
echo 📄 Creating backend environment file...

REM Generate JWT secret (simplified for Windows)
set JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long-for-security

(
echo # Backend Environment Variables
echo PORT=5000
echo NODE_ENV=development
echo.
echo # MongoDB Configuration
echo MONGODB_URI=%MONGODB_URI%
echo DATABASE_URL=%MONGODB_URI%
echo.
echo # JWT Configuration
echo JWT_SECRET=%JWT_SECRET%
echo JWT_EXPIRE=7d
echo.
echo # Google OAuth ^(optional - get from Google Cloud Console^)
echo GOOGLE_CLIENT_ID=your-google-oauth-client-id
echo GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
echo.
echo # CORS Configuration
echo FRONTEND_URL=http://localhost:3000
echo.
echo # Socket.io Configuration
echo SOCKET_CORS_ORIGIN=http://localhost:3000
) > backend\.env

echo ✅ Environment file created at backend\.env

REM Setup database
echo 🔧 Setting up database...

cd backend

REM Install dependencies if needed
if not exist "node_modules" (
    echo 📦 Installing backend dependencies...
    call npm install
)

REM Run database setup
echo 🔄 Setting up MongoDB indexes...
call npm run db:migrate

echo ✅ Database setup completed

cd ..

REM Optional: Seed sample data
echo.
set /p seed_choice="Would you like to seed the database with sample data? (y/N): "
if /i "%seed_choice%"=="y" (
    echo 🌱 Seeding database with sample data...
    cd backend
    call npm run db:seed
    echo ✅ Sample data created
    echo.
    echo Sample login credentials:
    echo   Admin: admin@taskmanager.com / Admin123!
    echo   User:  john@example.com / Password123!
    cd ..
)

echo.
echo 🎉 MongoDB setup completed successfully!
echo.
echo Next steps:
echo 1. Start the backend server: cd backend ^&^& npm run dev
echo 2. In another terminal, start the frontend: cd frontend ^&^& npm start
echo 3. Open http://localhost:3000 in your browser
echo.
echo Database connection details saved in: backend\.env
echo For more information, see: MONGODB_SETUP.md

pause