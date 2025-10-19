import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import request from 'supertest';

describe('Bloods E2E', () => {
    let app: INestApplication;
    let adminToken: string;
    let existingBloodId: number;

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
            existingBloodId = bloodsResponse.body[0].id;
        }
    });

    afterAll(async () => {
        await app.close();
    });

    describe('/api/bloods (GET)', () => {
        it('should return all blood types with authentication', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/bloods')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
            

            const blood = response.body[0];
            expect(blood).toHaveProperty('id');
            expect(blood).toHaveProperty('type');
            expect(blood).toHaveProperty('rh');
            expect(typeof blood.id).toBe('number');
            expect(typeof blood.type).toBe('string');
            expect(typeof blood.rh).toBe('string');
        });

        it('should fail to get blood types without authentication', async () => {
            await request(app.getHttpServer())
                .get('/api/bloods')
                .expect(401);
        });

        it('should fail to get blood types with invalid token', async () => {
            await request(app.getHttpServer())
                .get('/api/bloods')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
        });

        it('should return blood types with valid enum values', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/bloods')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);


            const validTypes = ['A', 'B', 'AB', 'O'];
            const validRh = ['+', '-'];

            response.body.forEach((blood: any) => {
                expect(validTypes).toContain(blood.type);
                expect(validRh).toContain(blood.rh);
            });
        });

        it('should return all 8 blood types (A+, A-, B+, B-, AB+, AB-, O+, O-)', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/bloods')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);


            expect(response.body.length).toBe(8);
        });

        it('should return blood types with unique combinations of type and rh', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/bloods')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);


            const combinations = response.body.map(
                (blood: any) => `${blood.type}${blood.rh}`
            );
            const uniqueCombinations = new Set(combinations);
            expect(uniqueCombinations.size).toBe(combinations.length);
        });

        it('should return blood types ordered or in a consistent manner', async () => {
            const response1 = await request(app.getHttpServer())
                .get('/api/bloods')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            const response2 = await request(app.getHttpServer())
                .get('/api/bloods')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);


            expect(response1.body).toEqual(response2.body);
        });

        it('should not expose sensitive or unnecessary relations', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/bloods')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            const blood = response.body[0];
            

            expect(blood).not.toHaveProperty('donors');
            expect(blood).not.toHaveProperty('bloodBags');
            expect(blood).not.toHaveProperty('requests');
        });
    });

    describe('/api/bloods/:id (GET)', () => {
        it('should return a blood type by ID with authentication', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/bloods/${existingBloodId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('id');
            expect(response.body.id).toBe(existingBloodId);
            expect(response.body).toHaveProperty('type');
            expect(response.body).toHaveProperty('rh');
        });

        it('should fail to get blood type without authentication', async () => {
            await request(app.getHttpServer())
                .get(`/api/bloods/${existingBloodId}`)
                .expect(401);
        });

        it('should fail to get blood type with invalid ID format', async () => {
            await request(app.getHttpServer())
                .get('/api/bloods/invalid')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);
        });

        it('should return 404 for non-existent blood type', async () => {
            await request(app.getHttpServer())
                .get('/api/bloods/999999')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);
        });

        it('should fail to get blood type with invalid token', async () => {
            await request(app.getHttpServer())
                .get(`/api/bloods/${existingBloodId}`)
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
        });

        it('should return blood type with valid enum values', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/bloods/${existingBloodId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            const validTypes = ['A', 'B', 'AB', 'O'];
            const validRh = ['+', '-'];

            expect(validTypes).toContain(response.body.type);
            expect(validRh).toContain(response.body.rh);
        });

        it('should return complete blood type information', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/bloods/${existingBloodId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.id).toBeDefined();
            expect(response.body.type).toBeDefined();
            expect(response.body.rh).toBeDefined();
            expect(Object.keys(response.body).length).toBeGreaterThanOrEqual(3);
        });

        it('should retrieve each blood type by its ID', async () => {

            const allBloodsResponse = await request(app.getHttpServer())
                .get('/api/bloods')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);


            for (const blood of allBloodsResponse.body) {
                const singleResponse = await request(app.getHttpServer())
                    .get(`/api/bloods/${blood.id}`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .expect(200);

                expect(singleResponse.body.id).toBe(blood.id);
                expect(singleResponse.body.type).toBe(blood.type);
                expect(singleResponse.body.rh).toBe(blood.rh);
            }
        });

        it('should not expose relations in single blood type response', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/bloods/${existingBloodId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);


            expect(response.body).not.toHaveProperty('donors');
            expect(response.body).not.toHaveProperty('bloodBags');
            expect(response.body).not.toHaveProperty('requests');
        });
    });

    describe('Blood Type Coverage', () => {
        it('should have A+ blood type', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/bloods')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            const aPositive = response.body.find(
                (blood: any) => blood.type === 'A' && blood.rh === '+'
            );
            expect(aPositive).toBeDefined();
        });

        it('should have A- blood type', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/bloods')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            const aNegative = response.body.find(
                (blood: any) => blood.type === 'A' && blood.rh === '-'
            );
            expect(aNegative).toBeDefined();
        });

        it('should have B+ blood type', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/bloods')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            const bPositive = response.body.find(
                (blood: any) => blood.type === 'B' && blood.rh === '+'
            );
            expect(bPositive).toBeDefined();
        });

        it('should have B- blood type', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/bloods')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            const bNegative = response.body.find(
                (blood: any) => blood.type === 'B' && blood.rh === '-'
            );
            expect(bNegative).toBeDefined();
        });

        it('should have AB+ blood type', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/bloods')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            const abPositive = response.body.find(
                (blood: any) => blood.type === 'AB' && blood.rh === '+'
            );
            expect(abPositive).toBeDefined();
        });

        it('should have AB- blood type', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/bloods')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            const abNegative = response.body.find(
                (blood: any) => blood.type === 'AB' && blood.rh === '-'
            );
            expect(abNegative).toBeDefined();
        });

        it('should have O+ blood type', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/bloods')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            const oPositive = response.body.find(
                (blood: any) => blood.type === 'O' && blood.rh === '+'
            );
            expect(oPositive).toBeDefined();
        });

        it('should have O- blood type', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/bloods')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            const oNegative = response.body.find(
                (blood: any) => blood.type === 'O' && blood.rh === '-'
            );
            expect(oNegative).toBeDefined();
        });
    });
});
