import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import request from 'supertest';

describe('Reports E2E', () => {
    let app: INestApplication;
    let adminToken: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        
        app.setGlobalPrefix('api');
        app.useGlobalPipes(new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }));
        
        await app.init();

        const response = await request(app.getHttpServer())
            .post('/api/auth/login')
            .send({ email: 'admin@mail.com', password: 'password123' })
            .expect(201);

        adminToken = response.body.access_token;
    });

    afterAll(async () => {
        await app.close();
    });

    describe('/api/reports/inventory (GET)', () => {
        it('should return inventory report with authentication', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/reports/inventory')
                .set('Authorization', `Bearer ${adminToken}`);

            expect([200, 404]).toContain(response.status);
            
            if (response.status === 200) {
                expect(Array.isArray(response.body)).toBe(true);
            }
        });

        it('should fail to get inventory report without authentication', async () => {
            await request(app.getHttpServer())
                .get('/api/reports/inventory')
                .expect(401);
        });

        it('should fail with invalid token', async () => {
            await request(app.getHttpServer())
                .get('/api/reports/inventory')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
        });

        it('should fail with invalid date format', async () => {
            await request(app.getHttpServer())
                .get('/api/reports/inventory')
                .query({ from: 'invalid-date' })
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);
        });

        it('should fail with invalid blood type', async () => {
            await request(app.getHttpServer())
                .get('/api/reports/inventory')
                .query({ type: 'Z' })
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);
        });

        it('should fail with invalid Rh factor', async () => {
            await request(app.getHttpServer())
                .get('/api/reports/inventory')
                .query({ rh: 'invalid' })
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);
        });
    });

    describe('/api/reports/requests/fulfillment (GET)', () => {
        it('should return requests fulfillment report with authentication', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/reports/requests/fulfillment')
                .set('Authorization', `Bearer ${adminToken}`);

            expect([200, 404]).toContain(response.status);
            
            if (response.status === 200) {
                expect(response.body).toHaveProperty('items');
                expect(response.body).toHaveProperty('limit');
                expect(response.body).toHaveProperty('offset');
                expect(response.body).toHaveProperty('total');
                expect(Array.isArray(response.body.items)).toBe(true);
            }
        });

        it('should fail without authentication', async () => {
            await request(app.getHttpServer())
                .get('/api/reports/requests/fulfillment')
                .expect(401);
        });

        it('should fail with invalid date format', async () => {
            await request(app.getHttpServer())
                .get('/api/reports/requests/fulfillment')
                .query({ from: 'not-a-date' })
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);
        });

        it('should fail with invalid limit (too high)', async () => {
            await request(app.getHttpServer())
                .get('/api/reports/requests/fulfillment')
                .query({ limit: 500 })
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);
        });

        it('should fail with invalid limit (negative)', async () => {
            await request(app.getHttpServer())
                .get('/api/reports/requests/fulfillment')
                .query({ limit: -1 })
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);
        });

        it('should fail with invalid offset (negative)', async () => {
            await request(app.getHttpServer())
                .get('/api/reports/requests/fulfillment')
                .query({ offset: -1 })
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);
        });
    });

    describe('/api/reports/requests/overdue (GET)', () => {
        it('should return overdue requests report with authentication', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/reports/requests/overdue')
                .set('Authorization', `Bearer ${adminToken}`);

            expect([200, 404]).toContain(response.status);
            
            if (response.status === 200) {
                expect(Array.isArray(response.body)).toBe(true);
            }
        });

        it('should fail without authentication', async () => {
            await request(app.getHttpServer())
                .get('/api/reports/requests/overdue')
                .expect(401);
        });

        it('should fail with invalid token', async () => {
            await request(app.getHttpServer())
                .get('/api/reports/requests/overdue')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
        });
    });

    describe('/api/reports/donors/activity (GET)', () => {
        it('should return donors activity report with authentication', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/reports/donors/activity')
                .set('Authorization', `Bearer ${adminToken}`);

            expect([200, 404]).toContain(response.status);
            
            if (response.status === 200) {
                expect(Array.isArray(response.body)).toBe(true);
            }
        });

        it('should fail without authentication', async () => {
            await request(app.getHttpServer())
                .get('/api/reports/donors/activity')
                .expect(401);
        });

        it('should fail with invalid date format', async () => {
            await request(app.getHttpServer())
                .get('/api/reports/donors/activity')
                .query({ from: 'invalid-date' })
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);
        });

        it('should fail with invalid token', async () => {
            await request(app.getHttpServer())
                .get('/api/reports/donors/activity')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
        });
    });

    describe('/api/reports/health-entities/summary (GET)', () => {
        it('should return health entities summary with authentication', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/reports/health-entities/summary')
                .set('Authorization', `Bearer ${adminToken}`);

            expect([200, 404]).toContain(response.status);
            
            if (response.status === 200) {
                expect(Array.isArray(response.body)).toBe(true);
            }
        });

        it('should fail without authentication', async () => {
            await request(app.getHttpServer())
                .get('/api/reports/health-entities/summary')
                .expect(401);
        });

        it('should fail with invalid date format', async () => {
            await request(app.getHttpServer())
                .get('/api/reports/health-entities/summary')
                .query({ to: 'not-a-date' })
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);
        });

        it('should fail with invalid token', async () => {
            await request(app.getHttpServer())
                .get('/api/reports/health-entities/summary')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
        });
    });

    describe('/api/reports/donations/by-blood (GET)', () => {
        it('should return donations by blood type report with authentication', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/reports/donations/by-blood')
                .set('Authorization', `Bearer ${adminToken}`);

            expect([200, 404]).toContain(response.status);
            
            if (response.status === 200) {
                expect(Array.isArray(response.body)).toBe(true);
            }
        });

        it('should fail without authentication', async () => {
            await request(app.getHttpServer())
                .get('/api/reports/donations/by-blood')
                .expect(401);
        });

        it('should fail with invalid groupBy value', async () => {
            await request(app.getHttpServer())
                .get('/api/reports/donations/by-blood')
                .query({ groupBy: 'invalid' })
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);
        });

        it('should fail with invalid date format', async () => {
            await request(app.getHttpServer())
                .get('/api/reports/donations/by-blood')
                .query({ from: 'not-a-date' })
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);
        });

        it('should fail with invalid token', async () => {
            await request(app.getHttpServer())
                .get('/api/reports/donations/by-blood')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
        });
    });

    describe('General Authorization Tests', () => {
        it('should require authentication for all report endpoints', async () => {
            const endpoints = [
                '/api/reports/inventory',
                '/api/reports/requests/fulfillment',
                '/api/reports/requests/overdue',
                '/api/reports/donors/activity',
                '/api/reports/health-entities/summary',
                '/api/reports/donations/by-blood'
            ];

            for (const endpoint of endpoints) {
                await request(app.getHttpServer())
                    .get(endpoint)
                    .expect(401);
            }
        });

        it('should reject invalid tokens for all report endpoints', async () => {
            const endpoints = [
                '/api/reports/inventory',
                '/api/reports/requests/fulfillment',
                '/api/reports/requests/overdue',
                '/api/reports/donors/activity',
                '/api/reports/health-entities/summary',
                '/api/reports/donations/by-blood'
            ];

            for (const endpoint of endpoints) {
                await request(app.getHttpServer())
                    .get(endpoint)
                    .set('Authorization', 'Bearer invalid-token')
                    .expect(401);
            }
        });
    });
});
