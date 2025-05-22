# TaskSmart API Documentation

This document provides details about the TaskSmart backend API, its structure, and how to use it.

## API Structure

The TaskSmart API follows a clean, modular architecture for maintainability and scalability:

```
server/
├── api/
│   ├── auth.ts       # Authentication routes
│   ├── tasks.ts      # Task management (CRUD)
│   ├── user.ts       # User profile and preferences
│   └── index.ts      # Main API router (combines all API routes)
├── utils/
│   ├── errorHandler.ts # Centralized error handler
│   └── logger.ts       # Custom logging utility  
├── auth.ts           # Firebase authentication middleware
├── db.ts             # Database connection
├── vite.ts           # Vite server configuration
└── index.ts          # Main server entry point
```

## Authentication

TaskSmart uses Firebase Authentication for secure user management. All API routes that require authentication are protected by Firebase token verification middleware.

### Authentication Flow:

1. The client obtains a Firebase ID token after user login
2. The client includes this token in all API requests via the Authorization header:
   ```
   Authorization: Bearer <firebase-id-token>
   ```
3. The server verifies this token before processing protected routes

## API Endpoints

### Authentication

- `POST /api/auth/verify`: Verify if a token is valid
- `GET /api/auth/me`: Get the current user's profile
- `POST /api/auth/signout`: Sign out (for server-side cleanup)

### Tasks

- `GET /api/tasks`: Get all tasks for the authenticated user
- `GET /api/tasks/:id`: Get a specific task by ID
- `GET /api/tasks/category/:category`: Get tasks by category
- `GET /api/tasks/priority/:priority`: Get tasks by priority
- `POST /api/tasks`: Create a new task
- `PUT /api/tasks/:id`: Update an existing task
- `DELETE /api/tasks/:id`: Delete a task
- `PATCH /api/tasks/:id/complete`: Toggle task completion status

### User Management

- `GET /api/users/me`: Get current user profile
- `GET /api/users/all`: List all users (admin only)
- `PATCH /api/users/:uid/role`: Update user role (admin only)
- `PUT /api/users/settings`: Update user settings
- `DELETE /api/users/account`: Delete user account

## Error Handling

TaskSmart uses a centralized error handling approach:

1. The API returns standardized error responses:
   ```json
   {
     "error": true,
     "message": "Descriptive error message"
   }
   ```

2. Error responses include appropriate HTTP status codes:
   - 400: Bad Request (invalid input)
   - 401: Unauthorized (not authenticated)
   - 403: Forbidden (not authorized)
   - 404: Not Found
   - 500: Server Error

## Security Features

- **Content Security Policy (CSP)**: Configured to prevent XSS and other injection attacks
- **CORS**: Strict cross-origin resource sharing policy
- **Helmet**: Various HTTP headers for security
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Zod schema validation for all API inputs

## Environment Variables

Configure these environment variables for proper operation:

```
# Firebase Configuration
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
GOOGLE_APPLICATION_CREDENTIALS=path/to/your/service-account.json

# Database
DATABASE_URL=postgres://username:password@localhost:5432/tasksmart

# Server Configuration
PORT=5000
NODE_ENV=development|production
ALLOWED_ORIGINS=http://localhost:5000,http://yourdomain.com
```

## Development Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Configure environment variables (create a `.env` file)

3. Start the development server:
   ```
   npm run dev
   ```

4. The API will be available at `http://localhost:5000/api`

## Testing

Run the test suite with:

```
npm test
```

## Deployment

For production deployment:

1. Build the project:
   ```
   npm run build
   ```

2. Start the production server:
   ```
   npm start
   ```

## API Versioning

The current version is considered v1 (implied in the URL). Future versions will be explicitly versioned with `/api/v2/` etc. 