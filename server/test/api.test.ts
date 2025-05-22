/**
 * TaskSmart API Tests
 * Basic test setup for API routes
 */
import request from 'supertest';
import express from 'express';
import apiRouter from '../api';
import { verifyFirebaseToken } from '../auth';

// Mock Firebase authentication for testing
jest.mock('../auth', () => ({
  verifyFirebaseToken: jest.fn((req, res, next) => {
    // Simulate authenticated user
    req.user = {
      uid: 'test-user-id',
      email: 'test@example.com',
      email_verified: true,
      name: 'Test User',
      role: 'user'
    };
    next();
  }),
  requireAdmin: jest.fn((req, res, next) => {
    if (req.user?.role === 'admin') {
      next();
    } else {
      res.status(403).json({ error: true, message: 'Admin access required' });
    }
  }),
  getFirebaseUser: jest.fn(() => {
    return {
      uid: 'test-user-id',
      email: 'test@example.com',
      emailVerified: true,
      displayName: 'Test User',
      metadata: {
        creationTime: new Date().toISOString(),
        lastSignInTime: new Date().toISOString()
      }
    };
  }),
  setUserClaims: jest.fn(() => true)
}));

// Mock storage for testing
jest.mock('../storage', () => ({
  storage: {
    getTasksByUserId: jest.fn(() => [
      { id: 1, title: 'Test Task', userId: 'test-user-id' }
    ]),
    getTaskById: jest.fn(() => ({ 
      id: 1, 
      title: 'Test Task', 
      userId: 'test-user-id' 
    })),
    createTask: jest.fn((data) => ({ 
      id: 1, 
      ...data 
    })),
  }
}));

// Create test app with API routes
const app = express();
app.use(express.json());
app.use('/api', apiRouter);

describe('API Routes', () => {
  // Health check test
  test('GET /api/health should return 200', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('timestamp');
  });

  // Auth routes tests
  describe('Auth Routes', () => {
    test('GET /api/auth/me should return user profile', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('uid');
      expect(response.body).toHaveProperty('email');
    });
  });
  
  // Task routes tests
  describe('Task Routes', () => {
    test('GET /api/tasks should return user tasks', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
    
    test('GET /api/tasks/:id should return a specific task', async () => {
      const response = await request(app)
        .get('/api/tasks/1')
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 1);
    });
    
    test('POST /api/tasks should create a new task', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', 'Bearer test-token')
        .send({ title: 'New Test Task', description: 'Test description' });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('title', 'New Test Task');
    });
  });
  
  // User routes tests
  describe('User Routes', () => {
    test('GET /api/users/me should return user profile', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer test-token');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('uid');
    });
  });
  
  // 404 test
  test('Non-existent route should return 404', async () => {
    const response = await request(app).get('/api/non-existent-route');
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', true);
  });
}); 