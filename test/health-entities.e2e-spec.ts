import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import request from 'supertest';

describe('Health Entities E2E', () => {
    let app: INestApplication;
    let adminToken: string;
    let createdHealthEntityId: number;
    let testUserId: number;

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


        const userResponse = await request(app.getHttpServer())
            .post('/api/users')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                email: 'healthentity_test@test.com',
                password: 'password123',
                roleName: 'entity',
            })
            .expect(201);

        testUserId = userResponse.body.id;
    });

    afterAll(async () => {
        await app.close();
    });

    describe('/api/health-entities (POST)', () => {
        it('should create a new health entity with valid data', async () => {
            const createHealthEntityDto = {
                nit: '900123456-7',
                name: 'Test Hospital',
                address: '123 Test Street',
                city: 'Test City',
                phone: '555-1234',
                email: 'test@hospital.com',
                institutionType: 'hospital',
                userId: testUserId,
            };

            const response = await request(app.getHttpServer())
                .post('/api/health-entities')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(createHealthEntityDto)
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body.nit).toBe(createHealthEntityDto.nit);
            expect(response.body.name).toBe(createHealthEntityDto.name);
            expect(response.body.city).toBe(createHealthEntityDto.city);
            expect(response.body.institutionType).toBe(createHealthEntityDto.institutionType);
            

            createdHealthEntityId = response.body.id;
            expect(createdHealthEntityId).toBeDefined();
            expect(typeof createdHealthEntityId).toBe('number');
        });

        it('should fail to create health entity without authentication', async () => {
            const createHealthEntityDto = {
                nit: '900999999-9',
                name: 'No Auth Hospital',
                address: '456 Test St',
                city: 'Test City',
                phone: '555-9999',
                email: 'noauth@test.com',
                institutionType: 'clinic',
                userId: testUserId,
            };

            await request(app.getHttpServer())
                .post('/api/health-entities')
                .send(createHealthEntityDto)
                .expect(401);
        });

        it('should fail to create health entity with missing nit', async () => {
            const createHealthEntityDto = {
                name: 'Test Clinic',
                address: '789 Test Ave',
                city: 'Test City',
                phone: '555-4567',
                email: 'clinic@test.com',
                institutionType: 'clinic',
                userId: testUserId,
            };

            await request(app.getHttpServer())
                .post('/api/health-entities')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(createHealthEntityDto)
                .expect(400);
        });

        it('should fail to create health entity with missing name', async () => {
            const createHealthEntityDto = {
                nit: '900111111-1',
                address: '789 Test Ave',
                city: 'Test City',
                phone: '555-4567',
                email: 'clinic@test.com',
                institutionType: 'clinic',
                userId: testUserId,
            };

            await request(app.getHttpServer())
                .post('/api/health-entities')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(createHealthEntityDto)
                .expect(400);
        });

        it('should fail to create health entity with invalid email format', async () => {
            const createHealthEntityDto = {
                nit: '900222222-2',
                name: 'Test Hospital',
                address: '123 Test St',
                city: 'Test City',
                phone: '555-1234',
                email: 'invalid-email',
                institutionType: 'hospital',
                userId: testUserId,
            };

            await request(app.getHttpServer())
                .post('/api/health-entities')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(createHealthEntityDto)
                .expect(400);
        });

        it('should fail to create health entity with missing userId', async () => {
            const createHealthEntityDto = {
                nit: '900333333-3',
                name: 'Test Hospital',
                address: '123 Test St',
                city: 'Test City',
                phone: '555-1234',
                email: 'test@hospital.com',
                institutionType: 'hospital',
            };

            await request(app.getHttpServer())
                .post('/api/health-entities')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(createHealthEntityDto)
                .expect(400);
        });

        it('should fail to create health entity with invalid userId type', async () => {
            const createHealthEntityDto = {
                nit: '900444444-4',
                name: 'Test Hospital',
                address: '123 Test St',
                city: 'Test City',
                phone: '555-1234',
                email: 'test@hospital.com',
                institutionType: 'hospital',
                userId: 'not-a-number',
            };

            await request(app.getHttpServer())
                .post('/api/health-entities')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(createHealthEntityDto)
                .expect(400);
        });

        it('should fail with invalid token', async () => {
            const createHealthEntityDto = {
                nit: '900555555-5',
                name: 'Test Hospital',
                address: '123 Test St',
                city: 'Test City',
                phone: '555-1234',
                email: 'test@hospital.com',
                institutionType: 'hospital',
                userId: testUserId,
            };

            await request(app.getHttpServer())
                .post('/api/health-entities')
                .set('Authorization', 'Bearer invalid-token')
                .send(createHealthEntityDto)
                .expect(401);
        });
    });

    describe('/api/health-entities (GET)', () => {
        it('should return all health entities with authentication', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/health-entities')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
            

            const healthEntity = response.body[0];
            expect(healthEntity).toHaveProperty('id');
            expect(healthEntity).toHaveProperty('nit');
            expect(healthEntity).toHaveProperty('name');
            expect(healthEntity).toHaveProperty('city');
            expect(healthEntity).toHaveProperty('institutionType');
        });

        it('should fail to get health entities without authentication', async () => {
            await request(app.getHttpServer())
                .get('/api/health-entities')
                .expect(401);
        });

        it('should fail to get health entities with invalid token', async () => {
            await request(app.getHttpServer())
                .get('/api/health-entities')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
        });

        it('should return health entities that include the created one', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/health-entities')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            const found = response.body.find(
                (he: any) => he.id === createdHealthEntityId
            );
            expect(found).toBeDefined();
            expect(found.name).toBe('Test Hospital');
        });
    });

    describe('/api/health-entities/:id (GET)', () => {
        it('should return a health entity by ID with authentication', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/health-entities/${createdHealthEntityId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('id');
            expect(response.body.id).toBe(createdHealthEntityId);
            expect(response.body).toHaveProperty('nit');
            expect(response.body).toHaveProperty('name');
            expect(response.body).toHaveProperty('institutionType');
            expect(response.body).toHaveProperty('user');
        });

        it('should fail to get health entity without authentication', async () => {
            await request(app.getHttpServer())
                .get(`/api/health-entities/${createdHealthEntityId}`)
                .expect(401);
        });

        it('should fail to get health entity with invalid ID format', async () => {
            await request(app.getHttpServer())
                .get('/api/health-entities/invalid')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);
        });

        it('should return 404 for non-existent health entity', async () => {
            await request(app.getHttpServer())
                .get('/api/health-entities/999999')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);
        });

        it('should fail to get health entity with invalid token', async () => {
            await request(app.getHttpServer())
                .get(`/api/health-entities/${createdHealthEntityId}`)
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
        });
    });

    describe('/api/health-entities/:id (PATCH)', () => {
        it('should update a health entity with valid data', async () => {
            const updateHealthEntityDto = {
                name: 'Updated Test Hospital',
                city: 'Updated City',
            };

            const response = await request(app.getHttpServer())
                .patch(`/api/health-entities/${createdHealthEntityId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateHealthEntityDto)
                .expect(200);

            expect(response.body).toHaveProperty('id');
            expect(response.body.id).toBe(createdHealthEntityId);
            expect(response.body.name).toBe(updateHealthEntityDto.name);
            expect(response.body.city).toBe(updateHealthEntityDto.city);
        });

        it('should fail to update health entity without authentication', async () => {
            const updateHealthEntityDto = {
                name: 'No Auth Update',
            };

            await request(app.getHttpServer())
                .patch(`/api/health-entities/${createdHealthEntityId}`)
                .send(updateHealthEntityDto)
                .expect(401);
        });

        it('should fail to update health entity with invalid email format', async () => {
            const updateHealthEntityDto = {
                email: 'invalid-email',
            };

            await request(app.getHttpServer())
                .patch(`/api/health-entities/${createdHealthEntityId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateHealthEntityDto)
                .expect(400);
        });

        it('should fail to update health entity with invalid ID format', async () => {
            const updateHealthEntityDto = {
                name: 'Test Update',
            };

            await request(app.getHttpServer())
                .patch('/api/health-entities/invalid')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateHealthEntityDto)
                .expect(400);
        });

        it('should return 404 when updating non-existent health entity', async () => {
            const updateHealthEntityDto = {
                name: 'Test Update',
            };

            await request(app.getHttpServer())
                .patch('/api/health-entities/999999')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateHealthEntityDto)
                .expect(404);
        });

        it('should fail to update health entity with invalid token', async () => {
            const updateHealthEntityDto = {
                name: 'Test Update',
            };

            await request(app.getHttpServer())
                .patch(`/api/health-entities/${createdHealthEntityId}`)
                .set('Authorization', 'Bearer invalid-token')
                .send(updateHealthEntityDto)
                .expect(401);
        });

        it('should reject updating nit (immutable field)', async () => {
            const updateHealthEntityDto = {
                nit: '900999999-9',
            };

            await request(app.getHttpServer())
                .patch(`/api/health-entities/${createdHealthEntityId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateHealthEntityDto)
                .expect(400);
        });

        it('should reject updating institutionType (immutable field)', async () => {
            const updateHealthEntityDto = {
                institutionType: 'clinic',
            };

            await request(app.getHttpServer())
                .patch(`/api/health-entities/${createdHealthEntityId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateHealthEntityDto)
                .expect(400);
        });
    });

    describe('/api/health-entities/:id (DELETE)', () => {
        it('should fail to delete health entity without authentication', async () => {
            await request(app.getHttpServer())
                .delete(`/api/health-entities/${createdHealthEntityId}`)
                .expect(401);
        });

        it('should fail to delete health entity with invalid ID format', async () => {
            await request(app.getHttpServer())
                .delete('/api/health-entities/invalid')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);
        });

        it('should return 404 when deleting non-existent health entity', async () => {
            await request(app.getHttpServer())
                .delete('/api/health-entities/999999')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);
        });

        it('should fail to delete health entity with invalid token', async () => {
            await request(app.getHttpServer())
                .delete(`/api/health-entities/${createdHealthEntityId}`)
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
        });

        it('should delete a health entity with valid ID', async () => {
            await request(app.getHttpServer())
                .delete(`/api/health-entities/${createdHealthEntityId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);
        });

        it('should verify health entity was deleted', async () => {
            await request(app.getHttpServer())
                .get(`/api/health-entities/${createdHealthEntityId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);
        });

        it('should not find deleted health entity in list', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/health-entities')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            const found = response.body.find(
                (he: any) => he.id === createdHealthEntityId
            );
            expect(found).toBeUndefined();
        });
    });
});
