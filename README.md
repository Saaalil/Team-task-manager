# Team Task Manager MVP

A lightweight Kanban-style web application for small teams to create, assign, and update tasks in real time.

## Features

- **Real-time Collaboration**: Instant task updates across team members using Socket.io
- **User Authentication**: JWT tokens and Google OAuth login
- **Kanban Board**: Drag-and-drop task management with customizable columns
- **Team Management**: Create teams, invite members, assign roles
- **Modern UI**: React frontend with Tailwind CSS
- **Fast Backend**: Node.js with Express and MongoDB

## Tech Stack

### Frontend
- React 18
- Tailwind CSS
- React Router DOM
- Socket.io Client
- React DnD (Drag and Drop)
- Axios

### Backend
- Node.js
- Express
- Socket.io
- MongoDB with Mongoose
- JWT Authentication
- Google OAuth 2.0
- Bcrypt

## Project Structure

```
team-task-manager/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── controllers/     # API route handlers
│   │   ├── middleware/      # Auth and validation middleware
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── utils/           # Helper functions
│   │   └── server.js        # Express server setup
│   ├── database/
│   │   ├── setup.js         # Database setup script
│   │   └── seed.js          # Sample data
│   └── package.json
└── frontend/                # React application
    ├── src/
    │   ├── components/      # Reusable components
    │   ├── pages/           # Page components
    │   ├── hooks/           # Custom React hooks
    │   ├── utils/           # Helper functions
    │   └── App.js           # Main app component
    └── package.json
```

## Quick Start

1. **Prerequisites**
   - Node.js 18+
   - MongoDB 7.0+
   - Google OAuth credentials (optional)

2. **Quick Start (Automated)**
   ```bash
   # Windows
   setup-mongodb.bat
   
   # macOS/Linux
   ./setup-mongodb.sh
   ```

3. **Manual Setup**
   
   **Backend Setup**
   ```bash
   cd backend
   npm install
   npm run db:migrate  # Sets up MongoDB indexes
   npm run db:seed     # Optional: Add sample data
   npm run dev
   ```

   **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm start
   ```

## Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/team_task_manager
DATABASE_URL=mongodb://localhost:27017/team_task_manager
JWT_SECRET=your-super-secret-jwt-key
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_GOOGLE_CLIENT_ID=your-google-oauth-client-id
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/google` - Google OAuth login

### Tasks
- `GET /api/tasks` - Get all tasks for team
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Teams
- `GET /api/teams` - Get user's teams
- `POST /api/teams` - Create new team
- `POST /api/teams/:id/invite` - Invite team member

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License