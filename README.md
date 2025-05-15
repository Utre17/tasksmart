# TaskSmart - AI-powered Task Management

TaskSmart is a modern task management application that uses AI to intelligently organize and prioritize tasks. The application processes natural language inputs to categorize tasks, set priorities, and extract due dates automatically.

## Features

- 🤖 AI-powered task processing
- 🔒 JWT-based authentication system
- 📱 Responsive design for all devices
- 🌈 Modern UI with Tailwind CSS and Shadcn components
- 🗄️ PostgreSQL database integration
- 📊 Task categorization and filtering
- 🔔 Priority-based task organization

## Tech Stack

- **Frontend**: React, TanStack Query, Tailwind CSS, Shadcn UI
- **Backend**: Node.js, Express
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT (JSON Web Tokens)
- **AI Integration**: OpenAI/OpenRouter API

## Project Structure

```
tasksmart/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions and API client
│   │   ├── pages/          # Page components
│   │   └── types/          # TypeScript type definitions
├── server/                 # Backend Express server
│   ├── auth.ts             # Authentication logic
│   ├── db.ts               # Database connection and setup
│   ├── index.ts            # Entry point for the server
│   ├── migrations.ts       # Database migrations
│   ├── routes.ts           # API route definitions
│   └── storage.ts          # Data storage and retrieval
├── shared/                 # Shared code between frontend and backend
│   └── schema.ts           # Database schema and type definitions
├── migrations/             # Database migration files
└── attached_assets/        # Static assets
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- OpenAI API key (optional for enhanced AI features)

### Setup Instructions

1. **Clone the repository**

```bash
git clone <repository-url>
cd tasksmart
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory with the following variables (see `.env.example` for reference):

```
DATABASE_URL=postgres://username:password@localhost:5432/tasksmart
JWT_SECRET=your_secure_jwt_secret
SESSION_SECRET=your_secure_session_secret
OPENAI_API_KEY=your_openai_api_key
```

4. **Set up database**

Create a PostgreSQL database and update the `DATABASE_URL` in your `.env` file.

Apply the database schema:

```bash
npm run db:push
```

5. **Run the development server**

```bash
npm run dev
```

The application will be available at `http://localhost:5000`.

### Building for Production

1. **Build the application**

```bash
npm run build
```

2. **Start the production server**

```bash
npm start
```

## Authentication

The application uses JWT-based authentication. Use the following test account for development:

- **Email**: test@example.com
- **Password**: password123

To create your own account, use the registration form at `/auth`.

## AI Integration

TaskSmart uses AI to process natural language task inputs. The application can:

- Extract task title, category, and priority from natural language
- Suggest due dates based on text content
- Generate task summaries and insights

To enable enhanced AI features, provide your own OpenAI API key in the `.env` file.

## Database Management

The application uses Drizzle ORM for database management. Key commands:

- `npm run db:push` - Apply schema changes to the database
- `npm run db:migrate` - Generate migration files

## Troubleshooting

### Database Connection Issues

If you encounter database connection issues, check:
- PostgreSQL service is running
- Database credentials in `.env` are correct
- Database exists and is accessible

### Authentication Issues

If authentication is not working:
- Check JWT_SECRET in `.env`
- Ensure the user exists in the database
- Verify password matches (for test user: password123)

## Future Improvements

- Progressive Web App (PWA) support for offline functionality
- Enhanced AI insights and analytics
- Email notifications for due tasks
- Team collaboration features
- Integration with calendar services

## License

MIT