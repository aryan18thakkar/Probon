import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../src/app.js';
import { runMigrations } from '../src/db/migrate.js';
import { createRateLimiter } from '../src/middleware/rateLimiter.js';
import express from 'express';

describe('Security & RBAC Hardening Suite', () => {
  before(() => {
    runMigrations();
  });

  let studentToken = '';
  let teacherToken = '';
  let taskId = null;

  test('Log in student and teacher accounts', async () => {
    const studentRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'aryan@example.com', password: 'Password123!' });
    assert.strictEqual(studentRes.status, 200);
    studentToken = studentRes.body.data.token;

    const teacherRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'teacher@example.com', password: 'Password123!' });
    assert.strictEqual(teacherRes.status, 200);
    teacherToken = teacherRes.body.data.token;
  });

  test('Create test task for RBAC verification check', async () => {
    // Get existing project
    const projRes = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${teacherToken}`);
    assert.strictEqual(projRes.status, 200);
    const proj = projRes.body.data[0];

    const taskRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        projectId: proj.id,
        title: 'Security Verification Test Task',
        priority: 'high',
      });
    assert.strictEqual(taskRes.status, 201);
    taskId = taskRes.body.data.id;
  });

  test('RBAC: Student role is forbidden (403) from confirming task verification', async () => {
    const res = await request(app)
      .post(`/api/tasks/${taskId}/verify`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ approved: true, feedbackNote: 'Unauthorized verification attempt' });

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.message.includes("does not have permission"));
  });

  test('RBAC: Teacher role is allowed to confirm task verification', async () => {
    const res = await request(app)
      .post(`/api/tasks/${taskId}/verify`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ approved: true, feedbackNote: 'Instructor approved verification' });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.verification_status, 'verified');
  });

  test('Input Sanitization: Strip null bytes and XSS script tags from request payloads', async () => {
    const maliciousTitle = 'Clean Task\0Name <script>alert("xss")</script>';
    const projRes = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${teacherToken}`);
    const proj = projRes.body.data[0];

    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        projectId: proj.id,
        title: maliciousTitle,
      });

    assert.strictEqual(res.status, 201);
    // Null bytes and script tags must have been stripped
    assert.strictEqual(res.body.data.title.includes('\0'), false);
    assert.strictEqual(res.body.data.title.includes('<script>'), false);
    assert.strictEqual(res.body.data.title.includes('alert("xss")'), false);
  });

  test('Rate Limiter: Throttles requests exceeding maximum limit with 429 status', async () => {
    // Spin up test server with a tight 3-request limit
    const testApp = express();
    testApp.use(createRateLimiter({ windowMs: 60000, max: 3, message: 'Test limit reached' }));
    testApp.get('/test', (req, res) => res.json({ ok: true }));

    // Request 1, 2, 3 should succeed
    for (let i = 0; i < 3; i++) {
      const res = await request(testApp)
        .get('/test')
        .set('x-test-rate-limit', 'true');
      assert.strictEqual(res.status, 200);
    }

    // Request 4 should be rejected with 429
    const blockedRes = await request(testApp)
      .get('/test')
      .set('x-test-rate-limit', 'true');
    assert.strictEqual(blockedRes.status, 429);
    assert.strictEqual(blockedRes.body.success, false);
    assert.ok(blockedRes.body.message.includes('Test limit reached'));
  });

  test('Authentication: Unauthenticated request to protected route is rejected with 401', async () => {
    const res = await request(app).get('/api/tasks/my');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });
});
