import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import request from 'supertest';

describe('Blood Bags E2E', () => {
    let app: INestApplication;
    let adminToken: string;
    let createdBloodBagId: number;
    let testDonorId: number;
    let testBloodId: number;
    let testRequestId: number;

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


        const donorsResponse = await request(app.getHttpServer())
            .get('/api/donors')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);

        if (donorsResponse.body.length > 0) {
            testDonorId = donorsResponse.body[0].id;
        } else {

            const userResponse = await request(app.getHttpServer())
                .post('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    email: 'bloodbag_donor@test.com',
                    password: 'password123',
                    roleName: 'donor',
                })
                .expect(201);


            const donorResponse = await request(app.getHttpServer())
                .post('/api/donors')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    document: '9998887776',
                    name: 'BloodBag',
                    lastname: 'Donor',
                    birthDate: '1990-01-01',
                    userId: userResponse.body.id,
                    bloodId: testBloodId,
                })
                .expect(201);

            testDonorId = donorResponse.body.id;
        }


        const requestsResponse = await request(app.getHttpServer())
            .get('/api/requests')
            .set('Authorization', `Bearer ${adminToken}`);

        if (requestsResponse.status === 200 && requestsResponse.body.length > 0) {
            testRequestId = requestsResponse.body[0].id;
        } else {

            const healthEntitiesResponse = await request(app.getHttpServer())
                .get('/api/health-entities')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            let healthEntityId;
            if (healthEntitiesResponse.body.length > 0) {
                healthEntityId = healthEntitiesResponse.body[0].id;
            } else {
                const userResponse = await request(app.getHttpServer())
                    .post('/api/users')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        email: 'bloodbag_entity@test.com',
                        password: 'password123',
                        roleName: 'entity',
                    })
                    .expect(201);

                const healthEntityResponse = await request(app.getHttpServer())
                    .post('/api/health-entities')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        nit: '900777777-7',
                        name: 'BloodBag Test Hospital',
                        address: '123 Test St',
                        city: 'Test City',
                        phone: '555-1234',
                        email: 'bloodbag@test.com',
                        institutionType: 'hospital',
                        userId: userResponse.body.id,
                    })
                    .expect(201);

                healthEntityId = healthEntityResponse.body.id;
            }


            const requestResponse = await request(app.getHttpServer())
                .post('/api/requests')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    quantityNeeded: 10,
                    dueDate: '2025-12-31',
                    bloodId: testBloodId,
                    healthEntityId: healthEntityId,
                })
                .expect(201);

            testRequestId = requestResponse.body.id;
        }
    });

    afterAll(async () => {
        await app.close();
    });

    describe('/api/blood-bags (POST)', () => {
        it('should create a new blood bag with valid data', async () => {
            const createBloodBagDto = {
                quantity: 450,
                donationDate: '2025-10-01',
                expirationDate: '2025-11-01',
                requestId: testRequestId,
                bloodId: testBloodId,
                donorId: testDonorId,
            };

            const response = await request(app.getHttpServer())
                .post('/api/blood-bags')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(createBloodBagDto)
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body.quantity).toBe(createBloodBagDto.quantity);
            

            createdBloodBagId = response.body.id;
            expect(createdBloodBagId).toBeDefined();
            expect(typeof createdBloodBagId).toBe('number');
        });

        it('should fail to create blood bag without authentication', async () => {
            const createBloodBagDto = {
                quantity: 450,
                donationDate: '2025-10-01',
                expirationDate: '2025-11-01',
                requestId: testRequestId,
                bloodId: testBloodId,
                donorId: testDonorId,
            };

            await request(app.getHttpServer())
                .post('/api/blood-bags')
                .send(createBloodBagDto)
                .expect(401);
        });

        it('should fail to create blood bag with missing quantity', async () => {
            const createBloodBagDto = {
                donationDate: '2025-10-01',
                expirationDate: '2025-11-01',
                requestId: testRequestId,
                bloodId: testBloodId,
                donorId: testDonorId,
            };

            await request(app.getHttpServer())
                .post('/api/blood-bags')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(createBloodBagDto)
                .expect(400);
        });

        it('should fail to create blood bag with invalid quantity type', async () => {
            const createBloodBagDto = {
                quantity: 'not-a-number',
                donationDate: '2025-10-01',
                expirationDate: '2025-11-01',
                requestId: testRequestId,
                bloodId: testBloodId,
                donorId: testDonorId,
            };

            await request(app.getHttpServer())
                .post('/api/blood-bags')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(createBloodBagDto)
                .expect(400);
        });

        it('should fail to create blood bag with missing donationDate', async () => {
            const createBloodBagDto = {
                quantity: 450,
                expirationDate: '2025-11-01',
                requestId: testRequestId,
                bloodId: testBloodId,
                donorId: testDonorId,
            };

            await request(app.getHttpServer())
                .post('/api/blood-bags')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(createBloodBagDto)
                .expect(400);
        });

        it('should fail to create blood bag with invalid donationDate format', async () => {
            const createBloodBagDto = {
                quantity: 450,
                donationDate: 'invalid-date',
                expirationDate: '2025-11-01',
                requestId: testRequestId,
                bloodId: testBloodId,
                donorId: testDonorId,
            };

            await request(app.getHttpServer())
                .post('/api/blood-bags')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(createBloodBagDto)
                .expect(400);
        });

        it('should fail to create blood bag with missing expirationDate', async () => {
            const createBloodBagDto = {
                quantity: 450,
                donationDate: '2025-10-01',
                requestId: testRequestId,
                bloodId: testBloodId,
                donorId: testDonorId,
            };

            await request(app.getHttpServer())
                .post('/api/blood-bags')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(createBloodBagDto)
                .expect(400);
        });

        it('should fail to create blood bag with invalid expirationDate format', async () => {
            const createBloodBagDto = {
                quantity: 450,
                donationDate: '2025-10-01',
                expirationDate: 'invalid-date',
                requestId: testRequestId,
                bloodId: testBloodId,
                donorId: testDonorId,
            };

            await request(app.getHttpServer())
                .post('/api/blood-bags')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(createBloodBagDto)
                .expect(400);
        });

        it('should fail to create blood bag with missing requestId', async () => {
            const createBloodBagDto = {
                quantity: 450,
                donationDate: '2025-10-01',
                expirationDate: '2025-11-01',
                bloodId: testBloodId,
                donorId: testDonorId,
            };

            await request(app.getHttpServer())
                .post('/api/blood-bags')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(createBloodBagDto)
                .expect(400);
        });

        it('should fail to create blood bag with invalid requestId type', async () => {
            const createBloodBagDto = {
                quantity: 450,
                donationDate: '2025-10-01',
                expirationDate: '2025-11-01',
                requestId: 'not-a-number',
                bloodId: testBloodId,
                donorId: testDonorId,
            };

            await request(app.getHttpServer())
                .post('/api/blood-bags')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(createBloodBagDto)
                .expect(400);
        });

        it('should fail to create blood bag with missing bloodId', async () => {
            const createBloodBagDto = {
                quantity: 450,
                donationDate: '2025-10-01',
                expirationDate: '2025-11-01',
                requestId: testRequestId,
                donorId: testDonorId,
            };

            await request(app.getHttpServer())
                .post('/api/blood-bags')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(createBloodBagDto)
                .expect(400);
        });

        it('should fail to create blood bag with invalid bloodId type', async () => {
            const createBloodBagDto = {
                quantity: 450,
                donationDate: '2025-10-01',
                expirationDate: '2025-11-01',
                requestId: testRequestId,
                bloodId: 'not-a-number',
                donorId: testDonorId,
            };

            await request(app.getHttpServer())
                .post('/api/blood-bags')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(createBloodBagDto)
                .expect(400);
        });

        it('should fail to create blood bag with missing donorId', async () => {
            const createBloodBagDto = {
                quantity: 450,
                donationDate: '2025-10-01',
                expirationDate: '2025-11-01',
                requestId: testRequestId,
                bloodId: testBloodId,
            };

            await request(app.getHttpServer())
                .post('/api/blood-bags')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(createBloodBagDto)
                .expect(400);
        });

        it('should fail to create blood bag with invalid donorId type', async () => {
            const createBloodBagDto = {
                quantity: 450,
                donationDate: '2025-10-01',
                expirationDate: '2025-11-01',
                requestId: testRequestId,
                bloodId: testBloodId,
                donorId: 'not-a-number',
            };

            await request(app.getHttpServer())
                .post('/api/blood-bags')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(createBloodBagDto)
                .expect(400);
        });

        it('should fail with invalid token', async () => {
            const createBloodBagDto = {
                quantity: 450,
                donationDate: '2025-10-01',
                expirationDate: '2025-11-01',
                requestId: testRequestId,
                bloodId: testBloodId,
                donorId: testDonorId,
            };

            await request(app.getHttpServer())
                .post('/api/blood-bags')
                .set('Authorization', 'Bearer invalid-token')
                .send(createBloodBagDto)
                .expect(401);
        });
    });

    describe('/api/blood-bags (GET)', () => {
        it('should return all blood bags with authentication', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/blood-bags')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
            

            const bloodBag = response.body[0];
            expect(bloodBag).toHaveProperty('id');
            expect(bloodBag).toHaveProperty('quantity');
            expect(bloodBag).toHaveProperty('donationDate');
            expect(bloodBag).toHaveProperty('expirationDate');
        });

        it('should fail to get blood bags without authentication', async () => {
            await request(app.getHttpServer())
                .get('/api/blood-bags')
                .expect(401);
        });

        it('should fail to get blood bags with invalid token', async () => {
            await request(app.getHttpServer())
                .get('/api/blood-bags')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
        });

        it('should return blood bags that include the created one', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/blood-bags')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            const found = response.body.find(
                (bag: any) => bag.id === createdBloodBagId
            );
            expect(found).toBeDefined();
            expect(found.quantity).toBe(450);
        });

        it('should return blood bags with request, blood and donor relations (eager loading)', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/blood-bags')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            const bloodBag = response.body.find(
                (bag: any) => bag.id === createdBloodBagId
            );
            

            expect(bloodBag).toHaveProperty('request');
            expect(bloodBag).toHaveProperty('blood');
            expect(bloodBag).toHaveProperty('donor');
            expect(bloodBag.request).toHaveProperty('id');
            expect(bloodBag.blood).toHaveProperty('id');
            expect(bloodBag.donor).toHaveProperty('id');
        });
    });

    describe('/api/blood-bags/:id (GET)', () => {
        it('should return a blood bag by ID with authentication', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/blood-bags/${createdBloodBagId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('id');
            expect(response.body.id).toBe(createdBloodBagId);
            expect(response.body).toHaveProperty('quantity');
            expect(response.body).toHaveProperty('donationDate');
            expect(response.body).toHaveProperty('expirationDate');
            expect(response.body).toHaveProperty('request');
            expect(response.body).toHaveProperty('blood');
            expect(response.body).toHaveProperty('donor');
        });

        it('should fail to get blood bag without authentication', async () => {
            await request(app.getHttpServer())
                .get(`/api/blood-bags/${createdBloodBagId}`)
                .expect(401);
        });

        it('should fail to get blood bag with invalid ID format', async () => {
            await request(app.getHttpServer())
                .get('/api/blood-bags/invalid')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);
        });

        it('should return 404 for non-existent blood bag', async () => {
            await request(app.getHttpServer())
                .get('/api/blood-bags/999999')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);
        });

        it('should fail to get blood bag with invalid token', async () => {
            await request(app.getHttpServer())
                .get(`/api/blood-bags/${createdBloodBagId}`)
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
        });
    });

    describe('/api/blood-bags/:id (PATCH)', () => {
        it('should update a blood bag with valid data (only quantity)', async () => {
            const updateBloodBagDto = {
                quantity: 500,
            };

            const response = await request(app.getHttpServer())
                .patch(`/api/blood-bags/${createdBloodBagId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateBloodBagDto)
                .expect(200);

            expect(response.body).toHaveProperty('id');
            expect(response.body.id).toBe(createdBloodBagId);
            expect(response.body.quantity).toBe(updateBloodBagDto.quantity);
        });

        it('should fail to update blood bag without authentication', async () => {
            const updateBloodBagDto = {
                quantity: 400,
            };

            await request(app.getHttpServer())
                .patch(`/api/blood-bags/${createdBloodBagId}`)
                .send(updateBloodBagDto)
                .expect(401);
        });

        it('should fail to update blood bag with invalid quantity type', async () => {
            const updateBloodBagDto = {
                quantity: 'not-a-number',
            };

            await request(app.getHttpServer())
                .patch(`/api/blood-bags/${createdBloodBagId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateBloodBagDto)
                .expect(400);
        });

        it('should fail to update blood bag with invalid ID format', async () => {
            const updateBloodBagDto = {
                quantity: 450,
            };

            await request(app.getHttpServer())
                .patch('/api/blood-bags/invalid')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateBloodBagDto)
                .expect(400);
        });

        it('should return 404 when updating non-existent blood bag', async () => {
            const updateBloodBagDto = {
                quantity: 450,
            };

            await request(app.getHttpServer())
                .patch('/api/blood-bags/999999')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateBloodBagDto)
                .expect(404);
        });

        it('should fail to update blood bag with invalid token', async () => {
            const updateBloodBagDto = {
                quantity: 450,
            };

            await request(app.getHttpServer())
                .patch(`/api/blood-bags/${createdBloodBagId}`)
                .set('Authorization', 'Bearer invalid-token')
                .send(updateBloodBagDto)
                .expect(401);
        });

        it('should reject updating donationDate (immutable field)', async () => {
            const updateBloodBagDto = {
                donationDate: '2025-12-01',
            };

            await request(app.getHttpServer())
                .patch(`/api/blood-bags/${createdBloodBagId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateBloodBagDto)
                .expect(400);
        });

        it('should reject updating expirationDate (immutable field)', async () => {
            const updateBloodBagDto = {
                expirationDate: '2026-01-01',
            };

            await request(app.getHttpServer())
                .patch(`/api/blood-bags/${createdBloodBagId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateBloodBagDto)
                .expect(400);
        });

        it('should reject updating bloodId (immutable field)', async () => {
            const updateBloodBagDto = {
                bloodId: 999,
            };

            await request(app.getHttpServer())
                .patch(`/api/blood-bags/${createdBloodBagId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateBloodBagDto)
                .expect(400);
        });

        it('should reject updating requestId (immutable field)', async () => {
            const updateBloodBagDto = {
                requestId: 999,
            };

            await request(app.getHttpServer())
                .patch(`/api/blood-bags/${createdBloodBagId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateBloodBagDto)
                .expect(400);
        });

        it('should reject updating donorId (immutable field)', async () => {
            const updateBloodBagDto = {
                donorId: 999,
            };

            await request(app.getHttpServer())
                .patch(`/api/blood-bags/${createdBloodBagId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateBloodBagDto)
                .expect(400);
        });
    });

    describe('/api/blood-bags/:id (DELETE)', () => {
        it('should fail to delete blood bag without authentication', async () => {
            await request(app.getHttpServer())
                .delete(`/api/blood-bags/${createdBloodBagId}`)
                .expect(401);
        });

        it('should fail to delete blood bag with invalid ID format', async () => {
            await request(app.getHttpServer())
                .delete('/api/blood-bags/invalid')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);
        });

        it('should return 404 when deleting non-existent blood bag', async () => {
            await request(app.getHttpServer())
                .delete('/api/blood-bags/999999')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);
        });

        it('should fail to delete blood bag with invalid token', async () => {
            await request(app.getHttpServer())
                .delete(`/api/blood-bags/${createdBloodBagId}`)
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
        });

        it('should delete a blood bag with valid ID', async () => {
            await request(app.getHttpServer())
                .delete(`/api/blood-bags/${createdBloodBagId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);
        });

        it('should verify blood bag was deleted', async () => {
            await request(app.getHttpServer())
                .get(`/api/blood-bags/${createdBloodBagId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);
        });

        it('should not find deleted blood bag in list', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/blood-bags')
                .set('Authorization', `Bearer ${adminToken}`);


            expect([200, 404]).toContain(response.status);

            if (response.status === 200) {
                const found = response.body.find(
                    (bag: any) => bag.id === createdBloodBagId
                );
                expect(found).toBeUndefined();
            }
        });
    });
});
