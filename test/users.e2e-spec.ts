import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import request from 'supertest';

describe('Users E2E', () => {
    let app: INestApplication;
    let adminToken: string;
    let createdUserId: number;

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

    describe('/api/users (POST)', () => {
        it('should create a new user with valid data', async () => {
            const createUserDto = {
                email: 'newuser@test.com',
                password: 'password123',
                roleName: 'admin',
            };

            const response = await request(app.getHttpServer())
                .post('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(createUserDto)
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body.email).toBe(createUserDto.email);
            expect(response.body).toHaveProperty('role');
            expect(response.body.role.name).toBe(createUserDto.roleName);
            
            // No debe retornar el password
            expect(response.body.password).toBeUndefined();
            
            // Guardar el ID para pruebas posteriores
            createdUserId = response.body.id;
        });

        it('should fail to create user without authentication', async () => {
            const createUserDto = {
                email: 'noauth@test.com',
                password: 'password123',
                roleName: 'admin',
            };

            await request(app.getHttpServer())
                .post('/api/users')
                .send(createUserDto)
                .expect(401);
        });

        it('should fail to create user with invalid email', async () => {
            const createUserDto = {
                email: 'invalidemail',
                password: 'password123',
                roleName: 'admin',
            };

            await request(app.getHttpServer())
                .post('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(createUserDto)
                .expect(400);
        });

        it('should fail to create user with missing email', async () => {
            const createUserDto = {
                password: 'password123',
                roleName: 'admin',
            };

            await request(app.getHttpServer())
                .post('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(createUserDto)
                .expect(400);
        });

        it('should fail to create user with missing password', async () => {
            const createUserDto = {
                email: 'test@test.com',
                roleName: 'admin',
            };

            await request(app.getHttpServer())
                .post('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(createUserDto)
                .expect(400);
        });

        it('should fail to create user with missing roleName', async () => {
            const createUserDto = {
                email: 'test@test.com',
                password: 'password123',
            };

            await request(app.getHttpServer())
                .post('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(createUserDto)
                .expect(400);
        });

        it('should fail to create user with duplicate email', async () => {
            const createUserDto = {
                email: 'admin@mail.com',
                password: 'password123',
                roleName: 'admin',
            };

            await request(app.getHttpServer())
                .post('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(createUserDto)
                .expect(404); 
        });
    });

    describe('/api/users (GET)', () => {
        it('should return all users with authentication', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
            
            const user = response.body[0];
            expect(user).toHaveProperty('id');
            expect(user).toHaveProperty('email');
            expect(user).toHaveProperty('role');
        });

        it('should fail to get users without authentication', async () => {
            await request(app.getHttpServer())
                .get('/api/users')
                .expect(401);
        });

        it('should fail to get users with invalid token', async () => {
            await request(app.getHttpServer())
                .get('/api/users')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
        });
    });

    describe('/api/users/:id (GET)', () => {
        it('should return a user by ID with authentication', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/users/${createdUserId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('id');
            expect(response.body.id).toBe(createdUserId);
            expect(response.body).toHaveProperty('email');
            expect(response.body).toHaveProperty('role');
        });

        it('should fail to get user without authentication', async () => {
            await request(app.getHttpServer())
                .get(`/api/users/${createdUserId}`)
                .expect(401);
        });

        it('should fail to get user with invalid ID format', async () => {
            await request(app.getHttpServer())
                .get('/api/users/invalid')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);
        });

        it('should return 404 for non-existent user', async () => {
            await request(app.getHttpServer())
                .get('/api/users/999999')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);
        });
    });

    describe('/api/users/:id (PATCH)', () => {
        it('should update a user with valid data', async () => {
            const updateUserDto = {
                email: 'updated@test.com',
            };

            const response = await request(app.getHttpServer())
                .patch(`/api/users/${createdUserId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateUserDto)
                .expect(200);

            expect(response.body).toHaveProperty('id');
            expect(response.body.email).toBe(updateUserDto.email);
        });

        it('should fail to update user without authentication', async () => {
            const updateUserDto = {
                email: 'updated2@test.com',
            };

            await request(app.getHttpServer())
                .patch(`/api/users/${createdUserId}`)
                .send(updateUserDto)
                .expect(401);
        });

        it('should fail to update user with invalid email', async () => {
            const updateUserDto = {
                email: 'invalidemail',
            };

            await request(app.getHttpServer())
                .patch(`/api/users/${createdUserId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateUserDto)
                .expect(400);
        });

        it('should fail to update user with invalid ID format', async () => {
            const updateUserDto = {
                email: 'test@test.com',
            };

            await request(app.getHttpServer())
                .patch('/api/users/invalid')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateUserDto)
                .expect(400);
        });

        it('should return 404 when updating non-existent user', async () => {
            const updateUserDto = {
                email: 'test@test.com',
            };

            await request(app.getHttpServer())
                .patch('/api/users/999999')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateUserDto)
                .expect(404);
        });
    });

    describe('/api/users/:id (DELETE)', () => {
        it('should fail to delete user without authentication', async () => {
            await request(app.getHttpServer())
                .delete(`/api/users/${createdUserId}`)
                .expect(401);
        });

        it('should fail to delete user with invalid ID format', async () => {
            await request(app.getHttpServer())
                .delete('/api/users/invalid')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);
        });

        it('should return 404 when deleting non-existent user', async () => {
            await request(app.getHttpServer())
                .delete('/api/users/999999')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);
        });

        it('should delete a user with valid ID', async () => {
            await request(app.getHttpServer())
                .delete(`/api/users/${createdUserId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);
        });

        it('should verify user was deleted', async () => {
            await request(app.getHttpServer())
                .get(`/api/users/${createdUserId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);
        });
    });
});
