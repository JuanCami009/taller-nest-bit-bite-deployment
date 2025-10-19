import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import request from 'supertest';

describe('Auth E2E', () => {
    let app: INestApplication;

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
    });

    afterAll(async () => {
        await app.close();
    });

    describe('/api/auth/login (POST)', () => {
        it('should login successfully with valid credentials', async () => {
            const loginDto = {
                email: 'admin@mail.com',
                password: 'password123',
            };

            const response = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send(loginDto)
                .expect(201);

            expect(response.body).toHaveProperty('access_token');
            expect(typeof response.body.access_token).toBe('string');
            expect(response.body.access_token).not.toBe('');
        });

        it('should fail login with invalid email', async () => {
            const loginDto = {
                email: 'nonexistent@mail.com',
                password: 'password123',
            };

            await request(app.getHttpServer())
                .post('/api/auth/login')
                .send(loginDto)
                .expect(404);
        });

        it('should fail login with invalid password', async () => {
            const loginDto = {
                email: 'admin@mail.com',
                password: 'wrongpassword',
            };

            await request(app.getHttpServer())
                .post('/api/auth/login')
                .send(loginDto)
                .expect(401);
        });

        it('should fail login with missing email', async () => {
            const loginDto = {
                password: 'password123',
            };

            await request(app.getHttpServer())
                .post('/api/auth/login')
                .send(loginDto)
                .expect(400);
        });

        it('should fail login with missing password', async () => {
            const loginDto = {
                email: 'admin@mail.com',
            };

            await request(app.getHttpServer())
                .post('/api/auth/login')
                .send(loginDto)
                .expect(400);
        });

        it('should fail login with invalid email format', async () => {
            const loginDto = {
                email: 'notanemail',
                password: 'password123',
            };

            await request(app.getHttpServer())
                .post('/api/auth/login')
                .send(loginDto)
                .expect(400);
        });

        it('should fail login with empty credentials', async () => {
            const loginDto = {
                email: '',
                password: '',
            };

            await request(app.getHttpServer())
                .post('/api/auth/login')
                .send(loginDto)
                .expect(400);
        });

        it('should return token that can be decoded', async () => {
            const loginDto = {
                email: 'admin@mail.com',
                password: 'password123',
            };

            const response = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send(loginDto)
                .expect(201);

            const token = response.body.access_token;
            
            const tokenParts = token.split('.');
            expect(tokenParts).toHaveLength(3);
        });
    });
});
