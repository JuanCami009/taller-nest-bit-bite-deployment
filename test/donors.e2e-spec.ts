import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import request from 'supertest';

describe('Donors E2E', () => {
    let app: INestApplication;
    let adminToken: string;
    let createdDonorId: number;
    let testUserId: number;
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


        const userResponse = await request(app.getHttpServer())
            .post('/api/users')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                email: 'donor_test@test.com',
                password: 'password123',
                roleName: 'donor',
            })
            .expect(201);

        testUserId = userResponse.body.id;


        const bloodsResponse = await request(app.getHttpServer())
            .get('/api/bloods')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);

        if (bloodsResponse.body.length > 0) {
            testBloodId = bloodsResponse.body[0].id;
        }
    });

    afterAll(async () => {
        await app.close();
    });

    describe('/api/donors (POST)', () => {
        it('should create a new donor with valid data', async () => {
            const createDonorDto = {
                document: '1234567890',
                name: 'John',
                lastname: 'Doe',
                birthDate: '1990-01-01',
                userId: testUserId,
                bloodId: testBloodId,
            };

            const response = await request(app.getHttpServer())
                .post('/api/donors')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(createDonorDto)
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body.document).toBe(createDonorDto.document);
            expect(response.body.name).toBe(createDonorDto.name);
            expect(response.body.lastname).toBe(createDonorDto.lastname);
            

            createdDonorId = response.body.id;
            expect(createdDonorId).toBeDefined();
            expect(typeof createdDonorId).toBe('number');
        });

        it('should fail to create donor without authentication', async () => {
            const createDonorDto = {
                document: '9999999999',
                name: 'No Auth',
                lastname: 'User',
                birthDate: '1990-01-01',
                userId: testUserId,
                bloodId: testBloodId,
            };

            await request(app.getHttpServer())
                .post('/api/donors')
                .send(createDonorDto)
                .expect(401);
        });

        it('should fail to create donor with missing document', async () => {
            const createDonorDto = {
                name: 'Test',
                lastname: 'Donor',
                birthDate: '1990-01-01',
                userId: testUserId,
                bloodId: testBloodId,
            };

            await request(app.getHttpServer())
                .post('/api/donors')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(createDonorDto)
                .expect(400);
        });

        it('should fail to create donor with missing name', async () => {
            const createDonorDto = {
                document: '1111111111',
                lastname: 'Donor',
                birthDate: '1990-01-01',
                userId: testUserId,
                bloodId: testBloodId,
            };

            await request(app.getHttpServer())
                .post('/api/donors')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(createDonorDto)
                .expect(400);
        });

        it('should fail to create donor with missing lastname', async () => {
            const createDonorDto = {
                document: '2222222222',
                name: 'Test',
                birthDate: '1990-01-01',
                userId: testUserId,
                bloodId: testBloodId,
            };

            await request(app.getHttpServer())
                .post('/api/donors')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(createDonorDto)
                .expect(400);
        });

        it('should fail to create donor with invalid birthDate format', async () => {
            const createDonorDto = {
                document: '3333333333',
                name: 'Test',
                lastname: 'Donor',
                birthDate: 'invalid-date',
                userId: testUserId,
                bloodId: testBloodId,
            };

            await request(app.getHttpServer())
                .post('/api/donors')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(createDonorDto)
                .expect(400);
        });

        it('should fail to create donor with missing userId', async () => {
            const createDonorDto = {
                document: '4444444444',
                name: 'Test',
                lastname: 'Donor',
                birthDate: '1990-01-01',
                bloodId: testBloodId,
            };

            await request(app.getHttpServer())
                .post('/api/donors')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(createDonorDto)
                .expect(400);
        });

        it('should fail to create donor with invalid userId type', async () => {
            const createDonorDto = {
                document: '5555555555',
                name: 'Test',
                lastname: 'Donor',
                birthDate: '1990-01-01',
                userId: 'not-a-number',
                bloodId: testBloodId,
            };

            await request(app.getHttpServer())
                .post('/api/donors')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(createDonorDto)
                .expect(400);
        });

        it('should fail to create donor with missing bloodId', async () => {
            const createDonorDto = {
                document: '6666666666',
                name: 'Test',
                lastname: 'Donor',
                birthDate: '1990-01-01',
                userId: testUserId,
            };

            await request(app.getHttpServer())
                .post('/api/donors')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(createDonorDto)
                .expect(400);
        });

        it('should fail to create donor with invalid bloodId type', async () => {
            const createDonorDto = {
                document: '7777777777',
                name: 'Test',
                lastname: 'Donor',
                birthDate: '1990-01-01',
                userId: testUserId,
                bloodId: 'not-a-number',
            };

            await request(app.getHttpServer())
                .post('/api/donors')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(createDonorDto)
                .expect(400);
        });

        it('should fail with invalid token', async () => {
            const createDonorDto = {
                document: '8888888888',
                name: 'Test',
                lastname: 'Donor',
                birthDate: '1990-01-01',
                userId: testUserId,
                bloodId: testBloodId,
            };

            await request(app.getHttpServer())
                .post('/api/donors')
                .set('Authorization', 'Bearer invalid-token')
                .send(createDonorDto)
                .expect(401);
        });
    });

    describe('/api/donors (GET)', () => {
        it('should return all donors with authentication', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/donors')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
            

            const donor = response.body[0];
            expect(donor).toHaveProperty('id');
            expect(donor).toHaveProperty('document');
            expect(donor).toHaveProperty('name');
            expect(donor).toHaveProperty('lastname');
            expect(donor).toHaveProperty('birthDate');
        });

        it('should fail to get donors without authentication', async () => {
            await request(app.getHttpServer())
                .get('/api/donors')
                .expect(401);
        });

        it('should fail to get donors with invalid token', async () => {
            await request(app.getHttpServer())
                .get('/api/donors')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
        });

        it('should return donors that include the created one', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/donors')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            const found = response.body.find(
                (donor: any) => donor.id === createdDonorId
            );
            expect(found).toBeDefined();
            expect(found.name).toBe('John');
            expect(found.lastname).toBe('Doe');
        });

        it('should return donors with user and blood relations (eager loading)', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/donors')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            const donor = response.body.find(
                (d: any) => d.id === createdDonorId
            );
            

            expect(donor).toHaveProperty('user');
            expect(donor).toHaveProperty('blood');
            expect(donor.user).toHaveProperty('id');
            expect(donor.blood).toHaveProperty('id');
        });
    });

    describe('/api/donors/:id (GET)', () => {
        it('should return a donor by ID with authentication', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/donors/${createdDonorId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('id');
            expect(response.body.id).toBe(createdDonorId);
            expect(response.body).toHaveProperty('document');
            expect(response.body).toHaveProperty('name');
            expect(response.body).toHaveProperty('lastname');
            expect(response.body).toHaveProperty('user');
            expect(response.body).toHaveProperty('blood');
        });

        it('should fail to get donor without authentication', async () => {
            await request(app.getHttpServer())
                .get(`/api/donors/${createdDonorId}`)
                .expect(401);
        });

        it('should fail to get donor with invalid ID format', async () => {
            await request(app.getHttpServer())
                .get('/api/donors/invalid')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);
        });

        it('should return 404 for non-existent donor', async () => {
            await request(app.getHttpServer())
                .get('/api/donors/999999')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);
        });

        it('should fail to get donor with invalid token', async () => {
            await request(app.getHttpServer())
                .get(`/api/donors/${createdDonorId}`)
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
        });
    });

    describe('/api/donors/:id (PATCH)', () => {
        it('should update a donor with valid data', async () => {
            const updateDonorDto = {
                name: 'Updated John',
                lastname: 'Updated Doe',
            };

            const response = await request(app.getHttpServer())
                .patch(`/api/donors/${createdDonorId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateDonorDto)
                .expect(200);

            expect(response.body).toHaveProperty('id');
            expect(response.body.id).toBe(createdDonorId);
            expect(response.body.name).toBe(updateDonorDto.name);
            expect(response.body.lastname).toBe(updateDonorDto.lastname);
        });

        it('should fail to update donor without authentication', async () => {
            const updateDonorDto = {
                name: 'No Auth Update',
            };

            await request(app.getHttpServer())
                .patch(`/api/donors/${createdDonorId}`)
                .send(updateDonorDto)
                .expect(401);
        });

        it('should fail to update donor with invalid ID format', async () => {
            const updateDonorDto = {
                name: 'Test Update',
            };

            await request(app.getHttpServer())
                .patch('/api/donors/invalid')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateDonorDto)
                .expect(400);
        });

        it('should return 404 when updating non-existent donor', async () => {
            const updateDonorDto = {
                name: 'Test Update',
            };

            await request(app.getHttpServer())
                .patch('/api/donors/999999')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateDonorDto)
                .expect(404);
        });

        it('should fail to update donor with invalid token', async () => {
            const updateDonorDto = {
                name: 'Test Update',
            };

            await request(app.getHttpServer())
                .patch(`/api/donors/${createdDonorId}`)
                .set('Authorization', 'Bearer invalid-token')
                .send(updateDonorDto)
                .expect(401);
        });

        it('should reject updating document (immutable field)', async () => {
            const updateDonorDto = {
                document: '9999999999',
            };

            await request(app.getHttpServer())
                .patch(`/api/donors/${createdDonorId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateDonorDto)
                .expect(400);
        });

        it('should reject updating birthDate (immutable field)', async () => {
            const updateDonorDto = {
                birthDate: '2000-01-01',
            };

            await request(app.getHttpServer())
                .patch(`/api/donors/${createdDonorId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateDonorDto)
                .expect(400);
        });

        it('should reject updating bloodId (immutable field)', async () => {
            const updateDonorDto = {
                bloodId: 999,
            };

            await request(app.getHttpServer())
                .patch(`/api/donors/${createdDonorId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateDonorDto)
                .expect(400);
        });

        it('should allow updating only name', async () => {
            const updateDonorDto = {
                name: 'Only Name Updated',
            };

            const response = await request(app.getHttpServer())
                .patch(`/api/donors/${createdDonorId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateDonorDto)
                .expect(200);

            expect(response.body.name).toBe(updateDonorDto.name);
        });

        it('should allow updating only lastname', async () => {
            const updateDonorDto = {
                lastname: 'Only Lastname Updated',
            };

            const response = await request(app.getHttpServer())
                .patch(`/api/donors/${createdDonorId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateDonorDto)
                .expect(200);

            expect(response.body.lastname).toBe(updateDonorDto.lastname);
        });

        it('should allow updating both name and lastname', async () => {
            const updateDonorDto = {
                name: 'Final Name',
                lastname: 'Final Lastname',
            };

            const response = await request(app.getHttpServer())
                .patch(`/api/donors/${createdDonorId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateDonorDto)
                .expect(200);

            expect(response.body.name).toBe(updateDonorDto.name);
            expect(response.body.lastname).toBe(updateDonorDto.lastname);
        });
    });

    describe('/api/donors/:id (DELETE)', () => {
        it('should fail to delete donor without authentication', async () => {
            await request(app.getHttpServer())
                .delete(`/api/donors/${createdDonorId}`)
                .expect(401);
        });

        it('should fail to delete donor with invalid ID format', async () => {
            await request(app.getHttpServer())
                .delete('/api/donors/invalid')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);
        });

        it('should return 404 when deleting non-existent donor', async () => {
            await request(app.getHttpServer())
                .delete('/api/donors/999999')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);
        });

        it('should fail to delete donor with invalid token', async () => {
            await request(app.getHttpServer())
                .delete(`/api/donors/${createdDonorId}`)
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
        });

        it('should delete a donor with valid ID', async () => {
            await request(app.getHttpServer())
                .delete(`/api/donors/${createdDonorId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);
        });

        it('should verify donor was deleted', async () => {
            await request(app.getHttpServer())
                .get(`/api/donors/${createdDonorId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);
        });

        it('should not find deleted donor in list', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/donors')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            const found = response.body.find(
                (donor: any) => donor.id === createdDonorId
            );
            expect(found).toBeUndefined();
        });
    });
});
