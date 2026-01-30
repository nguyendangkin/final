import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth Refresh Token Flow (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe());
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('POST /auth/refresh', () => {
        it('should return 401 without Authorization header', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/refresh')
                .send({ refreshToken: 'test-token' })
                .expect(401);

            expect(response.body.message).toBe('Missing or invalid authorization header');
        });

        it('should return 401 with invalid token format', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/refresh')
                .set('Authorization', 'Bearer invalid-jwt-format')
                .send({ refreshToken: 'test-token' })
                .expect(401);

            expect(response.body.message).toBe('Invalid token');
        });

        it('should return 401 with valid JWT but non-existent user', async () => {
            // Create a valid JWT structure but with fake user ID
            const fakeJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJub25leGlzdGVudC11c2VyIiwiZW1haWwiOiJ0ZXN0QHRlc3QuY29tIn0.fake';

            const response = await request(app.getHttpServer())
                .post('/auth/refresh')
                .set('Authorization', `Bearer ${fakeJwt}`)
                .send({ refreshToken: 'test-token' })
                .expect(401);

            expect(response.body.message).toBe('Invalid refresh token');
        });
    });

    describe('POST /auth/logout', () => {
        it('should return 401 without valid JWT', async () => {
            await request(app.getHttpServer())
                .post('/auth/logout')
                .expect(401);
        });
    });

    describe('GET /health', () => {
        it('should return health status', async () => {
            const response = await request(app.getHttpServer())
                .get('/health')
                .expect(200);

            expect(response.body).toHaveProperty('status');
            expect(response.body).toHaveProperty('database');
            expect(response.body).toHaveProperty('uptime');
            expect(response.body).toHaveProperty('memory');
            expect(response.body.status).toBe('healthy');
            expect(response.body.database).toBe('connected');
        });
    });
});
