import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';
import { User, Role, RoleType } from '../models';

// Test data
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'Password123!',
  confirmPassword: 'Password123!'
};

let authToken: string;
let refreshToken: string;
let userId: string;

// Connect to MongoDB before all tests
beforeAll(async () => {
  // Ensure test database is used
  if (!process.env.MONGODB_URI?.includes('test')) {
    throw new Error('Tests must use a test database');
  }
  
  // Connect to MongoDB
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Clear users collection
  await User.deleteMany({});
  
  // Ensure roles exist
  const userRole = await Role.findOne({ name: RoleType.USER });
  if (!userRole) {
    await Role.create({ name: RoleType.USER });
  }
  
  const adminRole = await Role.findOne({ name: RoleType.ADMIN });
  if (!adminRole) {
    await Role.create({ name: RoleType.ADMIN });
  }
});

// Disconnect from MongoDB after all tests
afterAll(async () => {
  await mongoose.connection.close();
});

describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);
      
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.username).toBe(testUser.username);
      expect(res.body.user.email).toBe(testUser.email);
      expect(res.body.token).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      
      // Save user ID for later tests
      userId = res.body.user._id;
    });
    
    it('should not register a user with existing email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);
      
      expect(res.status).toBe(400);
      expect(res.body.success).toBeFalsy();
      expect(res.body.message).toContain('Email đã được sử dụng');
    });
    
    it('should not register a user with missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'incomplete',
          email: 'incomplete@example.com'
        });
      
      expect(res.status).toBe(400);
      expect(res.body.success).toBeFalsy();
    });
    
    it('should not register a user with mismatched passwords', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          ...testUser,
          email: 'another@example.com',
          confirmPassword: 'DifferentPassword123!'
        });
      
      expect(res.status).toBe(400);
      expect(res.body.success).toBeFalsy();
      expect(res.body.message).toContain('không khớp');
    });
  });
  
  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toBeDefined();
      expect(res.body.token).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      
      // Save tokens for later tests
      authToken = res.body.token;
      refreshToken = res.body.refreshToken;
    });
    
    it('should not login with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrong@example.com',
          password: testUser.password
        });
      
      expect(res.status).toBe(401);
      expect(res.body.success).toBeFalsy();
    });
    
    it('should not login with invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!'
        });
      
      expect(res.status).toBe(401);
      expect(res.body.success).toBeFalsy();
    });
  });
  
  describe('POST /api/auth/refresh-token', () => {
    it('should refresh token with valid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      
      // Update token for later tests
      authToken = res.body.token;
    });
    
    it('should not refresh token with invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: 'invalid-token' });
      
      expect(res.status).toBe(401);
      expect(res.body.success).toBeFalsy();
    });
  });
  
  describe('POST /api/auth/logout', () => {
    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/auth/logout');
      
      expect(res.status).toBe(401);
      expect(res.body.success).toBeFalsy();
    });
    
    it('should logout successfully', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Đăng xuất thành công');
    });
  });
}); 