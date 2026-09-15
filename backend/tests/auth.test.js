import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../src/app.js';
import { runMigrations } from '../src/db/migrate.js';

describe('Authentication & RBAC API Endpoints', () => {
  before(() => {
    runMigrations();
  });

  const testUser = {
    name: 'Test Student',
    username: `teststudent_${Date.now()}`,
    email: `teststudent_${Date.now()}@example.com`,
    password: 'Password123!',
    role: 'student',
  };

  let authToken = '';

  test('POST /api/auth/register should create a new student account', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.token);
    assert.strictEqual(res.body.data.user.email, testUser.email);
    assert.strictEqual(res.body.data.user.role, 'student');
  });

  test('POST /api/auth/register should reject duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        ...testUser,
        username: `unique_${Date.now()}`,
      });

    assert.strictEqual(res.status, 409);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.message, 'An account with this email already exists.');
  });

  test('POST /api/auth/register should reject duplicate username', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        ...testUser,
        email: `unique_${Date.now()}@example.com`,
      });

    assert.strictEqual(res.status, 409);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.message, 'Username is already taken. Please choose another.');
  });

  test('POST /api/auth/register should reject invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Invalid Email',
        username: `invemail_${Date.now()}`,
        email: 'notanemail',
        password: 'Password123!',
      });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.message, 'Please provide a valid email address.');
  });

  test('POST /api/auth/register should reject weak password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Weak Pass',
        username: `weakpass_${Date.now()}`,
        email: `weakpass_${Date.now()}@example.com`,
        password: 'weak',
      });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.message.includes('Password must be at least 8 characters long'));
  });

  test('POST /api/auth/register should reject invalid username characters', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Bad Username',
        username: 'user with spaces!',
        email: `baduser_${Date.now()}@example.com`,
        password: 'Password123!',
      });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.message.includes('Username must be 3-30 characters'));
  });

  test('POST /api/auth/register returns email_verified = 0', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Verified Check',
        username: `vcheck_${Date.now()}`,
        email: `vcheck_${Date.now()}@example.com`,
        password: 'Password123!',
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.data.user.email_verified, 0);
  });

  test('POST /api/auth/login should authenticate seeded user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'aryan@example.com',
        password: 'Password123!',
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.token);
    assert.strictEqual(res.body.data.user.username, 'aryan');
    authToken = res.body.data.token;
  });

  test('GET /api/auth/me should return authenticated user profile', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.username, 'aryan');
    assert.strictEqual(res.body.data.role, 'student');
    assert.ok(res.body.data.xp >= 0);
  });

  test('GET /api/auth/me should reject request without token', async () => {
    const res = await request(app).get('/api/auth/me');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });

  // Verification & Password Reset Tests
  let verificationUserEmail = '';
  let verificationToken = '';

  test('POST /api/auth/register generates verificationToken', async () => {
    verificationUserEmail = `verify_${Date.now()}@example.com`;
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Verification User',
        username: `verify_${Date.now()}`,
        email: verificationUserEmail,
        password: 'Password123!',
      });

    assert.strictEqual(res.status, 201);
    assert.ok(res.body.data.verificationToken);
    verificationToken = res.body.data.verificationToken;
  });

  test('POST /api/auth/verify-email verifies email with valid token', async () => {
    const res = await request(app)
      .post('/api/auth/verify-email')
      .send({ token: verificationToken });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.message, 'Email verified successfully.');
  });

  test('POST /api/auth/verify-email rejects invalid or already used token', async () => {
    const res = await request(app)
      .post('/api/auth/verify-email')
      .send({ token: 'invalid-or-consumed-token' });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
  });

  let resetToken = '';

  test('POST /api/auth/forgot-password generates reset token for valid email', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: verificationUserEmail });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.resetToken);
    resetToken = res.body.resetToken;
  });

  test('POST /api/auth/reset-password rejects weak new password', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({
        token: resetToken,
        newPassword: 'weak',
      });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
  });

  test('POST /api/auth/reset-password successfully updates password', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({
        token: resetToken,
        newPassword: 'NewPassword123!',
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);

    // Old password should now fail
    const oldLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: verificationUserEmail,
        password: 'Password123!',
      });
    assert.strictEqual(oldLoginRes.status, 401);

    // New password should succeed
    const newLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: verificationUserEmail,
        password: 'NewPassword123!',
      });
    assert.strictEqual(newLoginRes.status, 200);
    assert.ok(newLoginRes.body.data.token);
  });
});
