import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import request from 'supertest';

describe('Permissions E2E', () => {
    let app: INestApplication;
    let adminToken: string;
    let createdPermissionId: number;

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

    describe('/api/permissions (POST)', () => {
        it('should create a new permission with valid data', async () => {
            const createPermissionDto = {
                name: 'test_permission_create',
            };

            const response = await request(app.getHttpServer())
                .post('/api/permissions')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(createPermissionDto)
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body.name).toBe(createPermissionDto.name);
            
            createdPermissionId = response.body.id;
            expect(createdPermissionId).toBeDefined();
            expect(typeof createdPermissionId).toBe('number');
        });

        it('should fail to create permission without authentication', async () => {
            const createPermissionDto = {
                name: 'no_auth_permission',
            };

            await request(app.getHttpServer())
                .post('/api/permissions')
                .send(createPermissionDto)
                .expect(401);
        });

        it('should fail to create permission with missing name', async () => {
            const createPermissionDto = {};

            await request(app.getHttpServer())
                .post('/api/permissions')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(createPermissionDto)
                .expect(400);
        });

        it('should fail to create permission with invalid name type', async () => {
            const createPermissionDto = {
                name: 123, 
            };

            await request(app.getHttpServer())
                .post('/api/permissions')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(createPermissionDto)
                .expect(400);
        });

        it('should fail to create permission with invalid token', async () => {
            const createPermissionDto = {
                name: 'test_permission',
            };

            await request(app.getHttpServer())
                .post('/api/permissions')
                .set('Authorization', 'Bearer invalid-token')
                .send(createPermissionDto)
                .expect(401);
        });
    });

    describe('/api/permissions (GET)', () => {
        it('should return all permissions with authentication', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/permissions')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
            
            const permission = response.body[0];
            expect(permission).toHaveProperty('id');
            expect(permission).toHaveProperty('name');
        });

        it('should fail to get permissions without authentication', async () => {
            await request(app.getHttpServer())
                .get('/api/permissions')
                .expect(401);
        });

        it('should fail to get permissions with invalid token', async () => {
            await request(app.getHttpServer())
                .get('/api/permissions')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
        });

        it('should return permissions that include the created one', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/permissions')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            const found = response.body.find(
                (p: any) => p.id === createdPermissionId
            );
            expect(found).toBeDefined();
            expect(found.name).toBe('test_permission_create');
        });
    });

    describe('/api/permissions/:id (GET)', () => {
        it('should return a permission by ID with authentication', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/permissions/${createdPermissionId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('id');
            expect(response.body.id).toBe(createdPermissionId);
            expect(response.body).toHaveProperty('name');
            expect(response.body.name).toBe('test_permission_create');
        });

        it('should fail to get permission without authentication', async () => {
            await request(app.getHttpServer())
                .get(`/api/permissions/${createdPermissionId}`)
                .expect(401);
        });

        it('should fail to get permission with invalid ID format', async () => {
            await request(app.getHttpServer())
                .get('/api/permissions/invalid')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);
        });

        it('should return 404 for non-existent permission', async () => {
            await request(app.getHttpServer())
                .get('/api/permissions/999999')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);
        });

        it('should fail to get permission with invalid token', async () => {
            await request(app.getHttpServer())
                .get(`/api/permissions/${createdPermissionId}`)
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
        });
    });

    describe('/api/permissions/:id (PATCH)', () => {
        it('should update a permission with valid data', async () => {
            const updatePermissionDto = {
                name: 'test_permission_updated',
            };

            const response = await request(app.getHttpServer())
                .patch(`/api/permissions/${createdPermissionId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updatePermissionDto)
                .expect(200);

            expect(response.body).toHaveProperty('id');
            expect(response.body.id).toBe(createdPermissionId);
            expect(response.body.name).toBe(updatePermissionDto.name);
        });

        it('should fail to update permission without authentication', async () => {
            const updatePermissionDto = {
                name: 'no_auth_update',
            };

            await request(app.getHttpServer())
                .patch(`/api/permissions/${createdPermissionId}`)
                .send(updatePermissionDto)
                .expect(401);
        });

        it('should fail to update permission with invalid name type', async () => {
            const updatePermissionDto = {
                name: 123,
            };

            await request(app.getHttpServer())
                .patch(`/api/permissions/${createdPermissionId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updatePermissionDto)
                .expect(400);
        });

        it('should fail to update permission with invalid ID format', async () => {
            const updatePermissionDto = {
                name: 'test',
            };

            await request(app.getHttpServer())
                .patch('/api/permissions/invalid')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updatePermissionDto)
                .expect(400);
        });

        it('should return 404 when updating non-existent permission', async () => {
            const updatePermissionDto = {
                name: 'test',
            };

            await request(app.getHttpServer())
                .patch('/api/permissions/999999')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updatePermissionDto)
                .expect(404);
        });

        it('should fail to update permission with invalid token', async () => {
            const updatePermissionDto = {
                name: 'test',
            };

            await request(app.getHttpServer())
                .patch(`/api/permissions/${createdPermissionId}`)
                .set('Authorization', 'Bearer invalid-token')
                .send(updatePermissionDto)
                .expect(401);
        });

    });

    describe('/api/permissions/:id (DELETE)', () => {
        it('should fail to delete permission without authentication', async () => {
            await request(app.getHttpServer())
                .delete(`/api/permissions/${createdPermissionId}`)
                .expect(401);
        });

        it('should fail to delete permission with invalid ID format', async () => {
            await request(app.getHttpServer())
                .delete('/api/permissions/invalid')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);
        });

        it('should return 404 when deleting non-existent permission', async () => {
            await request(app.getHttpServer())
                .delete('/api/permissions/999999')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);
        });

        it('should fail to delete permission with invalid token', async () => {
            await request(app.getHttpServer())
                .delete(`/api/permissions/${createdPermissionId}`)
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
        });

        it('should delete a permission with valid ID', async () => {
            await request(app.getHttpServer())
                .delete(`/api/permissions/${createdPermissionId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);
        });

        it('should verify permission was deleted', async () => {
            await request(app.getHttpServer())
                .get(`/api/permissions/${createdPermissionId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);
        });

        it('should not find deleted permission in list', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/permissions')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            const found = response.body.find(
                (p: any) => p.id === createdPermissionId
            );
            expect(found).toBeUndefined();
        });
    });
});
