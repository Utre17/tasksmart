# TaskSmart - Intelligent Task Management

TaskSmart is a modern task management system featuring intelligent task processing, analytics, and Firebase Authentication.

## Project Structure

```
tasksmart/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # React components (AuthProvider, UI Components)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions (Firebase, API client)
│   │   ├── pages/          # Page components (Home, Analytics, Settings)
│   │   └── styles/         # Tailwind CSS (if any custom CSS is needed)
├── server/                 # Node.js + Express Backend
│   ├── api/                # All API routes organized by feature
│   │   ├── tasks.ts        # Task management endpoints
│   │   └── users.ts        # User management endpoints
│   ├── config/             # Configuration files
│   │   └── firebase-service-account.json # Firebase service account
│   ├── utils/              # Utility functions
│   │   └── errorHandler.ts # Error handling utilities
│   ├── auth.ts             # Firebase Auth verification middleware
│   ├── db.ts               # Database connection (PostgreSQL with Drizzle ORM)
│   ├── index.ts            # Main server entry point
│   └── storage.ts          # Data access layer
└── shared/                 # Shared Types/Schema (TypeScript)
    └── schema.ts           # Database schema and type definitions
```

## Features

- **Firebase Authentication**: Secure authentication with email/password and Google sign-in options
- **Task Management**: Create, read, update, and delete tasks
- **Analytics**: Track your task completion rate and productivity
- **Role-Based Access Control**: Admin, manager, and user roles with different permissions
- **AI-Powered Task Processing**: Automatically categorize and organize tasks based on natural language input
- **Responsive UI**: Built with React and Tailwind CSS for a modern, mobile-friendly interface

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express, Firebase Admin SDK
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Firebase Authentication
- **Deployment**: Docker-ready

## Setup Instructions

### Prerequisites

- Node.js (16+)
- PostgreSQL database
- Firebase project with Authentication enabled

### Environment Setup

1. Clone the repository
2. Create a `.env` file in the root directory (use `env.example` as a template)
3. Set up your Firebase project:
   - Create a project in the [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password and Google providers)
   - Generate a service account key file for admin operations (Project Settings > Service Accounts > Generate new private key)
   - Place the service account JSON file in `server/config/firebase-service-account.json`

### Installation

```bash
# Install dependencies
npm install

# Initialize the database
npm run db:push

# Start the development server
npm run dev
```

The application will be available at http://localhost:5000

### Building for Production

```bash
# Build the client and server
npm run build

# Start the production server
npm start
```

## Authentication Flow

TaskSmart uses Firebase Authentication for all user management:

1. Users sign up/login via the frontend UI
2. Firebase issues an ID token after successful authentication
3. Token is passed to the backend in the Authorization header as a Bearer token
4. Server verifies the token using Firebase Admin SDK
5. User roles and permissions are managed through Firebase custom claims

## API Endpoints

The API follows RESTful conventions:

### Task Management

- `GET /api/tasks` - Get all tasks for the current user
- `GET /api/tasks/:id` - Get a specific task by ID
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/:id` - Update an existing task
- `DELETE /api/tasks/:id` - Delete a task
- `PATCH /api/tasks/:id/complete` - Toggle task completion status

### User Management

- `GET /api/users/me` - Get current user profile
- `GET /api/users/verify` - Verify authentication status
- `PATCH /api/users/:uid/role` - Update user role (admin only)

## License

MIT

# TaskSmart Authentication System

This document describes the JWT-based authentication system implemented in TaskSmart, including user registration, login, logout functionality, and role-based access control.

## Features

- Secure user registration with password hashing using bcrypt
- JWT-based authentication
- Role-based access control (User, Admin)
- Protected API routes with middleware
- Admin dashboard with user management

## Authentication Flow

1. **Registration**: Users register with email, username, and password
2. **Login**: Users authenticate and receive a JWT token
3. **Protected Routes**: JWT token is used to access protected resources
4. **Logout**: Token is invalidated client-side

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT token
- `POST /api/auth/logout` - Logout (client-side implementation)
- `GET /api/auth/me` - Get current user information

### User Management (Admin only)

- `GET /api/auth/users` - Get all users (admin only)
- `GET /api/auth/users/:userId` - Get user by ID (admin or own user)
- `PATCH /api/auth/users/:userId/role` - Update user role (admin only)

### Admin Dashboard

- `GET /api/admin/stats` - Get system statistics (admin only)

## Role-Based Access Control

TaskSmart implements two user roles:

1. **User**: Regular user with access to their own tasks
2. **Admin**: Administrator with access to user management and system statistics

## Setting Up the Admin User

To create an admin user, run:

```bash
npm run setup:admin
```

This will create an admin user with the following default credentials:
- Email: admin@tasksmart.com
- Password: Admin123!

You can customize the admin credentials by setting environment variables:

```bash
ADMIN_EMAIL=custom@example.com ADMIN_PASSWORD=SecurePassword npm run setup:admin
```

### Important Notes About Admin Setup:

- If you have a PostgreSQL database configured (via DATABASE_URL in your .env file), the admin user will be stored in the database.
- If no database is configured, an in-memory admin user will be created for testing purposes, but this user will be lost when the server restarts.
- For production use, you should always configure a database connection.

## Environment Variables

Configure the following environment variables for secure authentication:

- `JWT_SECRET` - Secret key for JWT token signing (default: a placeholder value for development)
- `ADMIN_EMAIL` - Email for admin user
- `ADMIN_PASSWORD` - Password for admin user

## Client-Side Implementation

The client uses React Query to handle authentication state and API calls:

- `useAuth()` hook provides authentication functionality
- `ProtectedRoute` component restricts access based on authentication and roles
- Admin dashboard displays system statistics and user management

## Security Considerations

- Password hashing with bcrypt (10 rounds)
- JWT tokens expire after 24 hours
- HTTPS recommended for production
- Role validation on both client and server
- Input validation using Zod schemas