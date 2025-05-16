import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import axios from 'axios';
import firebase from 'firebase/app';
import 'firebase/auth';

// Test configuration
const API_URL = 'http://localhost:5000/api';
const TEST_USER = {
  email: 'test@example.com',
  password: 'Password123!'
};

describe('Authentication Flow', () => {
  let idToken;
  
  // Setup Firebase for testing
  beforeAll(async () => {
    // Initialize Firebase with your test project config
    // This would typically come from environment variables
    const firebaseConfig = {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID
    };
    
    // Initialize Firebase
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
  });
  
  // Clean up after tests
  afterAll(async () => {
    try {
      // Sign out user if logged in
      await firebase.auth().signOut();
    } catch (error) {
      console.error('Error during test cleanup:', error);
    }
  });
  
  it('should allow a user to sign in and get a valid token', async () => {
    try {
      // Sign in the test user
      const userCredential = await firebase.auth().signInWithEmailAndPassword(
        TEST_USER.email, 
        TEST_USER.password
      );
      
      // Get the ID token
      idToken = await userCredential.user.getIdToken();
      
      // Verify we got a token
      expect(idToken).toBeTruthy();
      expect(typeof idToken).toBe('string');
      expect(idToken.length).toBeGreaterThan(100); // Firebase tokens are long
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  });
  
  it('should verify the token with the backend', async () => {
    // Skip if we don't have a token
    if (!idToken) {
      console.warn('Skipping test because no token is available');
      return;
    }
    
    try {
      // Call the verify endpoint
      const response = await axios.get(`${API_URL}/users/verify`, {
        headers: {
          Authorization: `Bearer ${idToken}`
        }
      });
      
      // Check the response
      expect(response.status).toBe(200);
      expect(response.data.authenticated).toBe(true);
      expect(response.data.userId).toBeTruthy();
      expect(response.data.email).toBe(TEST_USER.email);
    } catch (error) {
      console.error('Error verifying token:', error);
      throw error;
    }
  });
  
  it('should reject requests without a valid token', async () => {
    try {
      // Call a protected endpoint without a token
      await axios.get(`${API_URL}/tasks`);
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      // Should be an unauthorized error
      expect(error.response.status).toBe(401);
    }
  });
});

describe('Task Management', () => {
  let idToken;
  let taskId;
  
  // Setup before tests
  beforeAll(async () => {
    try {
      // Sign in the test user
      const userCredential = await firebase.auth().signInWithEmailAndPassword(
        TEST_USER.email, 
        TEST_USER.password
      );
      
      // Get the ID token
      idToken = await userCredential.user.getIdToken();
    } catch (error) {
      console.error('Error in test setup:', error);
    }
  });
  
  it('should create a new task', async () => {
    // Skip if we don't have a token
    if (!idToken) {
      console.warn('Skipping test because no token is available');
      return;
    }
    
    const newTask = {
      title: 'Test Task',
      category: 'Work',
      priority: 'Medium',
      completed: false
    };
    
    try {
      const response = await axios.post(`${API_URL}/tasks`, newTask, {
        headers: {
          Authorization: `Bearer ${idToken}`
        }
      });
      
      // Check the response
      expect(response.status).toBe(201);
      expect(response.data.title).toBe(newTask.title);
      expect(response.data.category).toBe(newTask.category);
      expect(response.data.priority).toBe(newTask.priority);
      expect(response.data.completed).toBe(newTask.completed);
      expect(response.data.id).toBeTruthy();
      
      // Save the task ID for later tests
      taskId = response.data.id;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  });
  
  it('should get all tasks for the user', async () => {
    // Skip if we don't have a token
    if (!idToken) {
      console.warn('Skipping test because no token is available');
      return;
    }
    
    try {
      const response = await axios.get(`${API_URL}/tasks`, {
        headers: {
          Authorization: `Bearer ${idToken}`
        }
      });
      
      // Check the response
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      // We should have at least one task (the one we just created)
      expect(response.data.length).toBeGreaterThan(0);
    } catch (error) {
      console.error('Error getting tasks:', error);
      throw error;
    }
  });
  
  it('should delete a task', async () => {
    // Skip if we don't have a token or task ID
    if (!idToken || !taskId) {
      console.warn('Skipping test because no token or task ID is available');
      return;
    }
    
    try {
      const response = await axios.delete(`${API_URL}/tasks/${taskId}`, {
        headers: {
          Authorization: `Bearer ${idToken}`
        }
      });
      
      // Check the response
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  });
}); 