import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import request from 'supertest';

describe('Requests E2E', () => {
    let app: INestApplication;
    let adminToken: string;
    let createdRequestId: number;
    let testHealthEntityId: number;
    let testBloodId: number;

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


        const bloodsResponse = await request(app.getHttpServer())
            .get('/api/bloods')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);

        if (bloodsResponse.body.length > 0) {
            testBloodId = bloodsResponse.body[0].id;
        }


        const healthEntitiesResponse = await request(app.getHttpServer())
            .get('/api/health-entities')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);

        if (healthEntitiesResponse.body.length > 0) {
            testHealthEntityId = healthEntitiesResponse.body[0].id;
        } else {

            const userResponse = await request(app.getHttpServer())
                .post('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    email: 'request_entity@test.com',
                    password: 'password123',
                    roleName: 'entity',
                })
                .expect(201);


            const healthEntityResponse = await request(app.getHttpServer())
                .post('/api/health-entities')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    nit: '900888888-8',
                    name: 'Request Test Hospital',
                    address: '123 Test St',
                    city: 'Test City',
                    phone: '555-1234',
                    email: 'request@test.com',
                    institutionType: 'hospital',
                    userId: userResponse.body.id,
                })
                .expect(201);

            testHealthEntityId = healthEntityResponse.body.id;
        }
    });

    afterAll(async () => {
        await app.close();
    });

    describe('/api/requests (POST)', () => {
        it('should create a new request with valid data', async () => {
            const createRequestDto = {
                quantityNeeded: 10,
                dueDate: '2025-12-31',
                bloodId: testBloodId,
                healthEntityId: testHealthEntityId,
            };

            const response = await request(app.getHttpServer())
                .post('/api/requests')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(createRequestDto)
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body.quantityNeeded).toBe(createRequestDto.quantityNeeded);
            

            createdRequestId = response.body.id;
            expect(createdRequestId).toBeDefined();
            expect(typeof createdRequestId).toBe('number');
        });

        it('should fail to create request without authentication', async () => {
            const createRequestDto = {
                quantityNeeded: 5,
                dueDate: '2025-12-31',
                bloodId: testBloodId,
                healthEntityId: testHealthEntityId,
            };

            await request(app.getHttpServer())
                .post('/api/requests')
                .send(createRequestDto)
                .expect(401);
        });

        it('should fail to create request with missing quantityNeeded', async () => {
            const createRequestDto = {
                dueDate: '2025-12-31',
                bloodId: testBloodId,
                healthEntityId: testHealthEntityId,
            };

            await request(app.getHttpServer())
                .post('/api/requests')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(createRequestDto)
                .expect(400);
        });

        it('should fail to create request with invalid quantityNeeded type', async () => {
            const createRequestDto = {
                quantityNeeded: 'not-a-number',
                dueDate: '2025-12-31',
                bloodId: testBloodId,
                healthEntityId: testHealthEntityId,
            };

            await request(app.getHttpServer())
                .post('/api/requests')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(createRequestDto)
                .expect(400);
        });

        it('should fail to create request with missing dueDate', async () => {
            const createRequestDto = {
                quantityNeeded: 10,
                bloodId: testBloodId,
                healthEntityId: testHealthEntityId,
            };

            await request(app.getHttpServer())
                .post('/api/requests')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(createRequestDto)
                .expect(400);
        });

        it('should fail to create request with invalid dueDate format', async () => {
            const createRequestDto = {
                quantityNeeded: 10,
                dueDate: 'invalid-date',
                bloodId: testBloodId,
                healthEntityId: testHealthEntityId,
            };

            await request(app.getHttpServer())
                .post('/api/requests')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(createRequestDto)
                .expect(400);
        });

        it('should fail to create request with missing bloodId', async () => {
            const createRequestDto = {
                quantityNeeded: 10,
                dueDate: '2025-12-31',
                healthEntityId: testHealthEntityId,
            };

            await request(app.getHttpServer())
                .post('/api/requests')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(createRequestDto)
                .expect(400);
        });

        it('should fail to create request with invalid bloodId type', async () => {
            const createRequestDto = {
                quantityNeeded: 10,
                dueDate: '2025-12-31',
                bloodId: 'not-a-number',
                healthEntityId: testHealthEntityId,
            };

            await request(app.getHttpServer())
                .post('/api/requests')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(createRequestDto)
                .expect(400);
        });

        it('should fail to create request with missing healthEntityId', async () => {
            const createRequestDto = {
                quantityNeeded: 10,
                dueDate: '2025-12-31',
                bloodId: testBloodId,
            };

            await request(app.getHttpServer())
                .post('/api/requests')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(createRequestDto)
                .expect(400);
        });

        it('should fail to create request with invalid healthEntityId type', async () => {
            const createRequestDto = {
                quantityNeeded: 10,
                dueDate: '2025-12-31',
                bloodId: testBloodId,
                healthEntityId: 'not-a-number',
            };

            await request(app.getHttpServer())
                .post('/api/requests')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(createRequestDto)
                .expect(400);
        });

        it('should fail with invalid token', async () => {
            const createRequestDto = {
                quantityNeeded: 10,
                dueDate: '2025-12-31',
                bloodId: testBloodId,
                healthEntityId: testHealthEntityId,
            };

            await request(app.getHttpServer())
                .post('/api/requests')
                .set('Authorization', 'Bearer invalid-token')
                .send(createRequestDto)
                .expect(401);
        });
    });

    describe('/api/requests (GET)', () => {
        it('should return all requests with authentication', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/requests')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
            

            const req = response.body[0];
            expect(req).toHaveProperty('id');
            expect(req).toHaveProperty('quantityNeeded');
            expect(req).toHaveProperty('dueDate');
            expect(req).toHaveProperty('dateCreated');
        });

        it('should fail to get requests without authentication', async () => {
            await request(app.getHttpServer())
                .get('/api/requests')
                .expect(401);
        });

        it('should fail to get requests with invalid token', async () => {
            await request(app.getHttpServer())
                .get('/api/requests')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
        });

        it('should return requests that include the created one', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/requests')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            const found = response.body.find(
                (req: any) => req.id === createdRequestId
            );
            expect(found).toBeDefined();
            expect(found.quantityNeeded).toBe(10);
        });

        it('should return requests with blood and healthEntity relations (eager loading)', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/requests')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            const req = response.body.find(
                (r: any) => r.id === createdRequestId
            );
            

            expect(req).toHaveProperty('blood');
            expect(req).toHaveProperty('healthEntity');
            expect(req.blood).toHaveProperty('id');
            expect(req.healthEntity).toHaveProperty('id');
        });
    });

    describe('/api/requests/:id (GET)', () => {
        it('should return a request by ID with authentication', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/requests/${createdRequestId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('id');
            expect(response.body.id).toBe(createdRequestId);
            expect(response.body).toHaveProperty('quantityNeeded');
            expect(response.body).toHaveProperty('dueDate');
            expect(response.body).toHaveProperty('dateCreated');
            expect(response.body).toHaveProperty('blood');
            expect(response.body).toHaveProperty('healthEntity');
        });

        it('should fail to get request without authentication', async () => {
            await request(app.getHttpServer())
                .get(`/api/requests/${createdRequestId}`)
                .expect(401);
        });

        it('should fail to get request with invalid ID format', async () => {
            await request(app.getHttpServer())
                .get('/api/requests/invalid')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);
        });

        it('should return 404 for non-existent request', async () => {
            await request(app.getHttpServer())
                .get('/api/requests/999999')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);
        });

        it('should fail to get request with invalid token', async () => {
            await request(app.getHttpServer())
                .get(`/api/requests/${createdRequestId}`)
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
        });
    });

    describe('/api/requests/:id (PATCH)', () => {
        it('should update a request with valid data', async () => {
            const updateRequestDto = {
                quantityNeeded: 15,
                dueDate: '2026-01-15',
            };

            const response = await request(app.getHttpServer())
                .patch(`/api/requests/${createdRequestId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateRequestDto)
                .expect(200);

            expect(response.body).toHaveProperty('id');
            expect(response.body.id).toBe(createdRequestId);
            expect(response.body.quantityNeeded).toBe(updateRequestDto.quantityNeeded);
        });

        it('should fail to update request without authentication', async () => {
            const updateRequestDto = {
                quantityNeeded: 20,
            };

            await request(app.getHttpServer())
                .patch(`/api/requests/${createdRequestId}`)
                .send(updateRequestDto)
                .expect(401);
        });

        it('should fail to update request with invalid quantityNeeded type', async () => {
            const updateRequestDto = {
                quantityNeeded: 'not-a-number',
            };

            await request(app.getHttpServer())
                .patch(`/api/requests/${createdRequestId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateRequestDto)
                .expect(400);
        });

        it('should fail to update request with invalid dueDate format', async () => {
            const updateRequestDto = {
                dueDate: 'invalid-date',
            };

            await request(app.getHttpServer())
                .patch(`/api/requests/${createdRequestId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateRequestDto)
                .expect(400);
        });

        it('should fail to update request with invalid ID format', async () => {
            const updateRequestDto = {
                quantityNeeded: 10,
            };

            await request(app.getHttpServer())
                .patch('/api/requests/invalid')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateRequestDto)
                .expect(400);
        });

        it('should return 404 when updating non-existent request', async () => {
            const updateRequestDto = {
                quantityNeeded: 10,
            };

            await request(app.getHttpServer())
                .patch('/api/requests/999999')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateRequestDto)
                .expect(404);
        });

        it('should fail to update request with invalid token', async () => {
            const updateRequestDto = {
                quantityNeeded: 10,
            };

            await request(app.getHttpServer())
                .patch(`/api/requests/${createdRequestId}`)
                .set('Authorization', 'Bearer invalid-token')
                .send(updateRequestDto)
                .expect(401);
        });

        it('should reject updating healthEntityId (immutable field)', async () => {
            const updateRequestDto = {
                healthEntityId: 999,
            };

            await request(app.getHttpServer())
                .patch(`/api/requests/${createdRequestId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateRequestDto)
                .expect(400);
        });

        it('should reject updating bloodId (immutable field)', async () => {
            const updateRequestDto = {
                bloodId: 999,
            };

            await request(app.getHttpServer())
                .patch(`/api/requests/${createdRequestId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateRequestDto)
                .expect(400);
        });

        it('should allow updating only quantityNeeded', async () => {
            const updateRequestDto = {
                quantityNeeded: 25,
            };

            const response = await request(app.getHttpServer())
                .patch(`/api/requests/${createdRequestId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateRequestDto)
                .expect(200);

            expect(response.body.quantityNeeded).toBe(updateRequestDto.quantityNeeded);
        });

        it('should allow updating only dueDate', async () => {
            const updateRequestDto = {
                dueDate: '2026-06-30',
            };

            const response = await request(app.getHttpServer())
                .patch(`/api/requests/${createdRequestId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateRequestDto)
                .expect(200);

            expect(response.body.dueDate).toBeDefined();
        });

        it('should allow updating both quantityNeeded and dueDate', async () => {
            const updateRequestDto = {
                quantityNeeded: 30,
                dueDate: '2026-12-31',
            };

            const response = await request(app.getHttpServer())
                .patch(`/api/requests/${createdRequestId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateRequestDto)
                .expect(200);

            expect(response.body.quantityNeeded).toBe(updateRequestDto.quantityNeeded);
        });
    });

    describe('/api/requests/:id (DELETE)', () => {
        it('should fail to delete request without authentication', async () => {
            await request(app.getHttpServer())
                .delete(`/api/requests/${createdRequestId}`)
                .expect(401);
        });

        it('should fail to delete request with invalid ID format', async () => {
            await request(app.getHttpServer())
                .delete('/api/requests/invalid')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);
        });

        it('should return 404 when deleting non-existent request', async () => {
            await request(app.getHttpServer())
                .delete('/api/requests/999999')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);
        });

        it('should fail to delete request with invalid token', async () => {
            await request(app.getHttpServer())
                .delete(`/api/requests/${createdRequestId}`)
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
        });

        it('should delete a request with valid ID', async () => {
            await request(app.getHttpServer())
                .delete(`/api/requests/${createdRequestId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);
        });

        it('should verify request was deleted', async () => {
            await request(app.getHttpServer())
                .get(`/api/requests/${createdRequestId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);
        });

        it('should not find deleted request in list', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/requests')
                .set('Authorization', `Bearer ${adminToken}`);


            expect([200, 404]).toContain(response.status);

            if (response.status === 200) {
                const found = response.body.find(
                    (req: any) => req.id === createdRequestId
                );
                expect(found).toBeUndefined();
            }
        });
    });
});
