import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import request from 'supertest';

describe('Roles E2E', () => {
    let app: INestApplication;
    let adminToken: string;
    let createdRoleId: number;
    let permissionId: number;

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

        const permissionsResponse = await request(app.getHttpServer())
            .get('/api/permissions')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);

        if (permissionsResponse.body.length > 0) {
            permissionId = permissionsResponse.body[0].id;
        }
    });

    afterAll(async () => {
        await app.close();
    });

    describe('/api/roles (POST)', () => {
        it('should create a new role with valid data', async () => {
            const createRoleDto = {
                name: 'test-role',
            };

            const response = await request(app.getHttpServer())
                .post('/api/roles')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(createRoleDto)
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body.name).toBe(createRoleDto.name);
            
            createdRoleId = response.body.id;
            expect(createdRoleId).toBeDefined();
            expect(typeof createdRoleId).toBe('number');
        });

        it('should fail to create role without authentication', async () => {
            const createRoleDto = {
                name: 'no-auth-role',
            };

            await request(app.getHttpServer())
                .post('/api/roles')
                .send(createRoleDto)
                .expect(401);
        });

        it('should fail to create role with missing name', async () => {
            const createRoleDto = {};

            await request(app.getHttpServer())
                .post('/api/roles')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(createRoleDto)
                .expect(400);
        });

        it('should fail to create role with invalid name type', async () => {
            const createRoleDto = {
                name: 123, 
            };

            await request(app.getHttpServer())
                .post('/api/roles')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(createRoleDto)
                .expect(400);
        });

    });

    describe('/api/roles (GET)', () => {
        it('should return all roles with authentication', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/roles')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
            
            const role = response.body[0];
            expect(role).toHaveProperty('id');
            expect(role).toHaveProperty('name');
            expect(role).toHaveProperty('permissions');
        });

        it('should fail to get roles without authentication', async () => {
            await request(app.getHttpServer())
                .get('/api/roles')
                .expect(401);
        });

        it('should fail to get roles with invalid token', async () => {
            await request(app.getHttpServer())
                .get('/api/roles')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
        });
    });

    describe('/api/roles/:id (GET)', () => {
        it('should return a role by ID with authentication', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/roles/${createdRoleId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('id');
            expect(response.body.id).toBe(createdRoleId);
            expect(response.body).toHaveProperty('name');
            expect(response.body).toHaveProperty('permissions');
        });

        it('should fail to get role without authentication', async () => {
            await request(app.getHttpServer())
                .get(`/api/roles/${createdRoleId}`)
                .expect(401);
        });

        it('should fail to get role with invalid ID format', async () => {
            await request(app.getHttpServer())
                .get('/api/roles/invalid')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);
        });

        it('should return 404 for non-existent role', async () => {
            await request(app.getHttpServer())
                .get('/api/roles/999999')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);
        });
    });

    describe('/api/roles/:id (PATCH)', () => {
        it('should update a role with valid data', async () => {
            const updateRoleDto = {
                name: 'updated-test-role',
            };

            const response = await request(app.getHttpServer())
                .patch(`/api/roles/${createdRoleId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateRoleDto)
                .expect(200);

            expect(response.body).toHaveProperty('id');
            expect(response.body.name).toBe(updateRoleDto.name);
        });

        it('should fail to update role without authentication', async () => {
            const updateRoleDto = {
                name: 'no-auth-update',
            };

            await request(app.getHttpServer())
                .patch(`/api/roles/${createdRoleId}`)
                .send(updateRoleDto)
                .expect(401);
        });

        it('should fail to update role with invalid name type', async () => {
            const updateRoleDto = {
                name: 123,
            };

            await request(app.getHttpServer())
                .patch(`/api/roles/${createdRoleId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateRoleDto)
                .expect(400);
        });

        it('should fail to update role with invalid ID format', async () => {
            const updateRoleDto = {
                name: 'test',
            };

            await request(app.getHttpServer())
                .patch('/api/roles/invalid')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateRoleDto)
                .expect(400);
        });

        it('should return 404 when updating non-existent role', async () => {
            const updateRoleDto = {
                name: 'test',
            };

            await request(app.getHttpServer())
                .patch('/api/roles/999999')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateRoleDto)
                .expect(404);
        });
    });

    describe('/api/roles/:id/permissions (GET)', () => {
        it('should return all permissions of a role', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/roles/${createdRoleId}/permissions`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
        });

        it('should fail to get role permissions without authentication', async () => {
            await request(app.getHttpServer())
                .get(`/api/roles/${createdRoleId}/permissions`)
                .expect(401);
        });

        it('should return 404 for non-existent role', async () => {
            await request(app.getHttpServer())
                .get('/api/roles/999999/permissions')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);
        });
    });

    describe('/api/roles/:id/permissions/:permissionId (POST)', () => {
        it('should assign a permission to a role', async () => {
            const response = await request(app.getHttpServer())
                .post(`/api/roles/${createdRoleId}/permissions/${permissionId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('permissions');
            expect(Array.isArray(response.body.permissions)).toBe(true);
            
            const hasPermission = response.body.permissions.some(
                (p: any) => p.id === permissionId
            );
            expect(hasPermission).toBe(true);
        });

        it('should fail to assign permission without authentication', async () => {
            await request(app.getHttpServer())
                .post(`/api/roles/${createdRoleId}/permissions/${permissionId}`)
                .expect(401);
        });

        it('should fail to assign permission with invalid role ID', async () => {
            await request(app.getHttpServer())
                .post(`/api/roles/invalid/permissions/${permissionId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);
        });

        it('should fail to assign permission with invalid permission ID', async () => {
            await request(app.getHttpServer())
                .post(`/api/roles/${createdRoleId}/permissions/invalid`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);
        });

        it('should return 404 when assigning to non-existent role', async () => {
            await request(app.getHttpServer())
                .post(`/api/roles/999999/permissions/${permissionId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);
        });

    });

    describe('/api/roles/:id/permissions/multiple (POST)', () => {
        it('should assign multiple permissions to a role', async () => {
            const permissionsResponse = await request(app.getHttpServer())
                .get('/api/permissions')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            const permissionIds = permissionsResponse.body
                .slice(0, 3)
                .map((p: any) => p.id);

            const assignDto = {
                permissionIds: permissionIds,
            };

            const response = await request(app.getHttpServer())
                .post(`/api/roles/${createdRoleId}/permissions/multiple`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(assignDto)
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('permissions');
            expect(Array.isArray(response.body.permissions)).toBe(true);
        });

        it('should fail to assign multiple permissions without authentication', async () => {
            const assignDto = {
                permissionIds: [1, 2, 3],
            };

            await request(app.getHttpServer())
                .post(`/api/roles/${createdRoleId}/permissions/multiple`)
                .send(assignDto)
                .expect(401);
        });

        it('should fail to assign multiple permissions with invalid array', async () => {
            const assignDto = {
                permissionIds: 'not-an-array',
            };

            await request(app.getHttpServer())
                .post(`/api/roles/${createdRoleId}/permissions/multiple`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(assignDto)
                .expect(400);
        });

        it('should fail to assign multiple permissions with non-numeric IDs', async () => {
            const assignDto = {
                permissionIds: ['a', 'b', 'c'],
            };

            await request(app.getHttpServer())
                .post(`/api/roles/${createdRoleId}/permissions/multiple`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(assignDto)
                .expect(400);
        });

        it('should fail to assign multiple permissions without permissionIds', async () => {
            const assignDto = {};

            await request(app.getHttpServer())
                .post(`/api/roles/${createdRoleId}/permissions/multiple`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(assignDto)
                .expect(400);
        });
    });

    describe('/api/roles/:id/permissions/:permissionId (DELETE)', () => {
        it('should remove a permission from a role', async () => {
            const response = await request(app.getHttpServer())
                .delete(`/api/roles/${createdRoleId}/permissions/${permissionId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('permissions');
            
            const hasPermission = response.body.permissions.some(
                (p: any) => p.id === permissionId
            );
            expect(hasPermission).toBe(false);
        });

        it('should fail to remove permission without authentication', async () => {
            await request(app.getHttpServer())
                .delete(`/api/roles/${createdRoleId}/permissions/${permissionId}`)
                .expect(401);
        });

        it('should fail to remove permission with invalid role ID', async () => {
            await request(app.getHttpServer())
                .delete(`/api/roles/invalid/permissions/${permissionId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);
        });

        it('should fail to remove permission with invalid permission ID', async () => {
            await request(app.getHttpServer())
                .delete(`/api/roles/${createdRoleId}/permissions/invalid`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);
        });

        it('should return 404 when removing from non-existent role', async () => {
            await request(app.getHttpServer())
                .delete(`/api/roles/999999/permissions/${permissionId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);
        });
    });

    describe('/api/roles/:id (DELETE)', () => {
        it('should fail to delete role without authentication', async () => {
            await request(app.getHttpServer())
                .delete(`/api/roles/${createdRoleId}`)
                .expect(401);
        });

        it('should fail to delete role with invalid ID format', async () => {
            await request(app.getHttpServer())
                .delete('/api/roles/invalid')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);
        });

        it('should return 404 when deleting non-existent role', async () => {
            await request(app.getHttpServer())
                .delete('/api/roles/999999')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);
        });

        it('should delete a role with valid ID', async () => {
            await request(app.getHttpServer())
                .delete(`/api/roles/${createdRoleId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);
        });

        it('should verify role was deleted', async () => {
            await request(app.getHttpServer())
                .get(`/api/roles/${createdRoleId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);
        });
    });
});
