# Team Task Manager - Development Setup

This guide will help you set up the Team Task Manager MVP for development.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+** (https://nodejs.org/)
- **npm 8+** (comes with Node.js)
- **PostgreSQL 14+** (https://www.postgresql.org/)
- **Git** (https://git-scm.com/)

## Database Setup

1. **Install PostgreSQL** if not already installed
2. **Create a new database**:
   ```sql
   CREATE DATABASE team_task_manager;
   CREATE USER task_manager_user WITH ENCRYPTED PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE team_task_manager TO task_manager_user;
   ```

3. **Update environment variables** (see Environment Configuration below)

## Installation

1. **Clone the repository** (or navigate to your project directory):
   ```bash
   cd team-task-manager
   ```

2. **Install root dependencies**:
   ```bash
   npm install
   ```

3. **Install all project dependencies**:
   ```bash
   npm run install-all
   ```

## Environment Configuration

### Backend Environment (.env)

Create `backend/.env` from `backend/.env.example`:

```bash
cp backend/.env.example backend/.env
```

Update the following variables in `backend/.env`:

```env
# Database Configuration
DATABASE_URL=postgresql://task_manager_user:your_password@localhost:5432/team_task_manager
DB_HOST=localhost
DB_PORT=5432
DB_NAME=team_task_manager
DB_USER=task_manager_user
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
JWT_EXPIRE=7d

# Google OAuth Configuration (Optional)
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret

# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
SOCKET_CORS_ORIGIN=http://localhost:3000
```

### Frontend Environment (.env)

Create `frontend/.env` from `frontend/.env.example`:

```bash
cp frontend/.env.example frontend/.env
```

Update if necessary:

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000
REACT_APP_GOOGLE_CLIENT_ID=your-google-oauth-client-id
REACT_APP_APP_NAME=Team Task Manager
REACT_APP_VERSION=1.0.0
```

## Database Migration and Seeding

1. **Run database migrations**:
   ```bash
   cd backend
   npm run db:migrate
   ```

2. **Seed the database with sample data** (optional):
   ```bash
   npm run db:seed
   ```

## Running the Application

### Development Mode (Both Frontend and Backend)

From the root directory:

```bash
npm run dev
```

This will start:
- Backend server on http://localhost:5000
- Frontend development server on http://localhost:3000

### Individual Services

**Backend only**:
```bash
npm run backend:dev
```

**Frontend only**:
```bash
npm run frontend:dev
```

## Google OAuth Setup (Optional)

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create a new project** or select existing one
3. **Enable Google+ API**
4. **Create OAuth 2.0 credentials**:
   - Application type: Web application
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:3000`
5. **Copy Client ID** and add to environment variables

## Default Login Credentials

After running the seed script, you can use these accounts:

```
Admin User:
Email: admin@taskmanager.com
Password: Admin123!

Regular Users:
Email: john@example.com / Password: Password123!
Email: jane@example.com / Password: Password123!
Email: mike@example.com / Password: Password123!
```

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/google` - Google OAuth login
- `GET /auth/profile` - Get user profile
- `PUT /auth/profile` - Update user profile
- `POST /auth/logout` - Logout

### Teams Endpoints
- `GET /teams` - Get user's teams
- `POST /teams` - Create team
- `GET /teams/:id` - Get team details
- `PUT /teams/:id` - Update team
- `DELETE /teams/:id` - Delete team

### Tasks Endpoints
- `GET /tasks/teams/:teamId` - Get team tasks
- `POST /tasks/teams/:teamId` - Create task
- `GET /tasks/:id` - Get task details
- `PUT /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task

## Project Structure

```
team-task-manager/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/      # Authentication & validation
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── utils/           # Helper functions
│   │   └── server.js        # Express server
│   ├── database/
│   │   ├── migrations/      # Database migrations
│   │   └── seeds/           # Sample data
│   └── package.json
├── frontend/                # React application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom hooks
│   │   ├── services/        # API services
│   │   ├── contexts/        # React contexts
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Helper functions
│   └── package.json
└── README.md
```

## Available Scripts

### Root Level
- `npm run dev` - Start both frontend and backend
- `npm run install-all` - Install all dependencies
- `npm run backend:dev` - Start backend only
- `npm run frontend:dev` - Start frontend only

### Backend Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data
- `npm run db:reset` - Reset database (migrate + seed)
- `npm test` - Run tests

### Frontend Scripts
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

## Troubleshooting

### Database Connection Issues
1. Ensure PostgreSQL is running
2. Check database credentials in `.env`
3. Verify database exists and user has permissions

### Port Already in Use
1. Check if ports 3000 or 5000 are in use
2. Kill existing processes or change ports in environment variables

### Missing Dependencies
1. Delete `node_modules` directories
2. Run `npm run install-all` from root directory

### CORS Issues
1. Verify `FRONTEND_URL` in backend `.env`
2. Check `REACT_APP_API_URL` in frontend `.env`

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the console for error messages
3. Ensure all environment variables are set correctly