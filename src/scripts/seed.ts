import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';

import { Role } from '../auth/entities/role.entity';
import { Permission } from '../auth/entities/permission.entity';
import { User } from '../auth/entities/user.entity';
import {
    Blood,
    Type as BloodType,
    Rh as BloodRh,
} from '../donations/entities/blood.entity';

import { Repository } from 'typeorm';
import { Donor } from '../donations/entities/donor.entity';
import { HealthEntity, InstitutionType } from '../donations/entities/health-entity.entity';
import { DeepPartial } from 'typeorm';

dotenv.config();

type SupportedDbTypes =
    | 'mysql'
    | 'postgres'
    | 'sqlite'
    | 'mariadb'
    | 'mongodb'
    | 'oracle';

const AppDataSource = new DataSource({
    type: (process.env.DB_TYPE as SupportedDbTypes) || 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_DATABASE || 'test',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    logging: false,
});

// Lista de permisos usados en la app
const PERMISSIONS = [
    // users
    'user_create',
    'user_read',
    'user_update',
    'user_delete',
    // roles
    'role_create',
    'role_read',
    'role_update',
    'role_delete',
    // permissions
    'permission_create',
    'permission_read',
    'permission_update',
    'permission_delete',
    // donors
    'donor_create',
    'donor_read',
    'donor_update',
    'donor_delete',
    // health-entities
    'health_entity_create',
    'health_entity_read',
    'health_entity_update',
    'health_entity_delete',
    // requests
    'request_create',
    'request_read',
    'request_update',
    'request_delete',
    // blood-bags
    'blood_create',
    'blood_read',
    'blood_update',
    'blood_delete',
    // reports
    'report_read',
] as const;

type PermissionName = (typeof PERMISSIONS)[number];

type RoleName = 'admin' | 'entity' | 'donor';


async function ensureRole(
    roleRepo: Repository<Role>,
    name: RoleName,
): Promise<Role> {
    // TypeORM upsert requiere unique en "name"; si no, fallback a find + save
    let role = await roleRepo.findOne({ where: { name } });
    if (!role) {
        role = roleRepo.create({ name, permissions: [] });
        role = await roleRepo.save(role);
    }
    return role;
}

async function ensurePermission(
    permRepo: Repository<Permission>,
    name: PermissionName,
): Promise<Permission> {
    let perm = await permRepo.findOne({ where: { name } });
    if (!perm) {
        perm = permRepo.create({ name });
        perm = await permRepo.save(perm);
    }
    return perm;
}

async function assignPermissionsToRole(
    roleRepo: Repository<Role>,
    permRepo: Repository<Permission>,
    role: Role,
    names: PermissionName[],
) {
    const current = await roleRepo.findOne({
        where: { id: role.id },
        relations: ['permissions'],
    });
    if (!current) throw new Error(`Role with id ${role.id} not found`);
    const needed = await Promise.all(
        names.map((n) => ensurePermission(permRepo, n)),
    );
    const map = new Map(
        current.permissions.map((p: Permission) => [p.name, p]),
    );
    for (const p of needed) map.set(p.name, p);
    current.permissions = Array.from(map.values());
    await roleRepo.save(current);
}

async function seedBloodTypes(bloodRepo: Repository<Blood>) {
    // Asegurar todas las combinaciones de Type x Rh (8 registros)
    const types = [BloodType.A, BloodType.B, BloodType.AB, BloodType.O];
    const rhs = [BloodRh.POSITIVE, BloodRh.NEGATIVE];

    for (const t of types) {
        for (const r of rhs) {
            const exists = await bloodRepo.findOne({
                where: { type: t, rh: r },
            });
            if (!exists) {
                const b = bloodRepo.create({
                    type: t,
                    rh: r,
                } as Partial<Blood>);
                await bloodRepo.save(b);
            }
        }
    }
}

async function ensureHealthEntity(
    healthRepo: Repository<HealthEntity>,
    user: User,
    payload: DeepPartial<HealthEntity>,
) {
    // intenta por nit primero
    let ent: HealthEntity | null = null;
    if (payload.nit) {
        ent = await healthRepo.findOne({ where: { nit: payload.nit } });
    }
    if (!ent) {
        // intenta por user
        ent = await healthRepo.findOne({ where: { user: { id: user.id } } });
    }
    if (!ent) {
        const toSave: DeepPartial<HealthEntity> = { ...payload, user };
        ent = healthRepo.create(toSave);
        ent = await healthRepo.save(ent as DeepPartial<HealthEntity> & HealthEntity);
    } else {
        // si existe pero no está enlazado al usuario, enlazar
        if (!ent.user || ent.user.id !== user.id) {
            ent.user = user;
            ent = await healthRepo.save(ent as DeepPartial<HealthEntity> & HealthEntity);
        }
    }
    return ent;
}

async function ensureDonor(
    donorRepo: Repository<Donor>,
    user: User,
    payload: DeepPartial<Donor>,
    bloodRepo: Repository<Blood>,
) {
    let donor = await donorRepo.findOne({ where: { user: { id: user.id } } });
    // find blood entity if provided as type/rh
    if (
        payload.blood &&
        typeof payload.blood === 'object' &&
        !(payload.blood)?.id
    ) {
        const b = payload.blood as DeepPartial<Blood> | undefined;
        if (b && b.type && b.rh) {
            const found = await bloodRepo.findOne({ where: { type: b.type as BloodType, rh: b.rh as BloodRh } });
            if (found) payload.blood = found as DeepPartial<Blood>;
        }
    }
    if (!donor) {
        const toSave: DeepPartial<Donor> = { ...payload, user };
        donor = donorRepo.create(toSave);
        donor = await donorRepo.save(donor as DeepPartial<Donor> & Donor);
    } else {
        // actualiza campos básicos si faltan
        let changed = false;
        if (payload.document && donor.document !== payload.document) {
            donor.document = payload.document;
            changed = true;
        }
        if (payload.name && donor.name !== payload.name) {
            donor.name = payload.name;
            changed = true;
        }
        if (payload.lastname && donor.lastname !== payload.lastname) {
            donor.lastname = payload.lastname;
            changed = true;
        }
        if (payload.birthDate && String(donor.birthDate) !== String(payload.birthDate)) {
            donor.birthDate = payload.birthDate as Date;
            changed = true;
        }
        if (
            payload.blood &&
            (!donor.blood ||
                (typeof payload.blood === 'object' &&
                 payload.blood !== null &&
                 'id' in payload.blood &&
                 donor.blood.id !== (payload.blood as { id: number }).id))
        ) {
            // Ensure donor.blood is a Blood entity, not DeepPartial<Blood>
            let bloodEntity: Blood | null = null;
            if (typeof payload.blood === 'object' && payload.blood !== null && 'id' in payload.blood && (payload.blood as { id?: number }).id) {
                bloodEntity = await bloodRepo.findOne({ where: { id: (payload.blood as { id: number }).id } });
            }
            if (bloodEntity) {
                donor.blood = bloodEntity;
                changed = true;
            }
        }
        if (changed) donor = await donorRepo.save(donor as DeepPartial<Donor> & Donor);
    }
    return donor;
}

async function ensureUser(
    userRepo: Repository<User>,
    email: string,
    passwordPlain: string,
    role: Role,
): Promise<User> {
    let user = await userRepo.findOne({ where: { email } });
    const hashed = await bcrypt.hash(passwordPlain, 10);
    if (!user) {
        user = userRepo.create({ email, password: hashed, role });
        user = await userRepo.save(user);
    } else {
        // Mantén idempotencia: si ya existe, actualiza el role si cambió (opcional)
        if (!user.role || user.role.id !== role.id) {
            user.role = role;
            await userRepo.save(user);
        }
    }
    return user;
}

async function seed() {
    await AppDataSource.initialize();

    const roleRepo = AppDataSource.getRepository(Role);
    const permRepo = AppDataSource.getRepository(Permission);
    const userRepo = AppDataSource.getRepository(User);
    const bloodRepo = AppDataSource.getRepository(Blood);

    // 1) Roles base
    const adminRole = await ensureRole(roleRepo, 'admin');
    const entityRole = await ensureRole(roleRepo, 'entity');
    const donorRole = await ensureRole(roleRepo, 'donor');

    // 2) Permissions (crear todas las que usas)
    await Promise.all(
        PERMISSIONS.map((p) => ensurePermission(permRepo, p)),
    );

    // 3) Asignación de permissions a cada rol
    //    - admin: todas
    await assignPermissionsToRole(roleRepo, permRepo, adminRole, [
        ...PERMISSIONS,
    ]);

    //    - entity: puede gestionar donors/requests/blood-bags
    await assignPermissionsToRole(roleRepo, permRepo, entityRole, [
        'donor_create',
        'donor_read',
        'donor_update',
        'donor_delete',
        'request_create',
        'request_read',
        'request_update',
        'request_delete',
        'blood_create',
        'blood_read',
        'blood_update',
        'blood_delete',
        'report_read'
    ]);

    //    - donor: solo lectura de su info (ajústalo a tu política)
    await assignPermissionsToRole(roleRepo, permRepo, donorRole, [
        'donor_read',
    ]);

    // 4) Tipos de sangre (8 combinaciones)
    await seedBloodTypes(bloodRepo);

    // 5) Usuarios base
    const adminUser = await ensureUser(userRepo, 'admin@mail.com', 'password123', adminRole);
    const entityUser = await ensureUser(userRepo, 'entity@mail.com', 'entitypass', entityRole);
    const donorUser = await ensureUser(userRepo, 'donor@mail.com', 'donorpass', donorRole);

    // crear algunos usuarios adicionales (idempotente)
    const donorUser2 = await ensureUser(userRepo, 'jdoe@mail.com', 'donor2pass', donorRole);
    const donorUser3 = await ensureUser(userRepo, 'maria@mail.com', 'donor3pass', donorRole);
    const entityUser2 = await ensureUser(userRepo, 'clinic@mail.com', 'entity2pass', entityRole);

    const donorRepo = AppDataSource.getRepository(Donor);
    const healthRepo = AppDataSource.getRepository(HealthEntity);

    // Obtener algunos tipos de sangre de ejemplo
    const oPos = await bloodRepo.findOne({ where: { type: BloodType.O, rh: BloodRh.POSITIVE } });
    const aNeg = await bloodRepo.findOne({ where: { type: BloodType.A, rh: BloodRh.NEGATIVE } });
    const abPos = await bloodRepo.findOne({ where: { type: BloodType.AB, rh: BloodRh.POSITIVE } });

    // 6) Donadores
    await ensureDonor(donorRepo, donorUser, {
        document: '1001',
        name: 'Carlos',
        lastname: 'Perez',
        birthDate: new Date('1990-05-20'),
        blood: oPos ?? undefined,
    }, bloodRepo);

    await ensureDonor(donorRepo, donorUser2, {
        document: '1002',
        name: 'Juan',
        lastname: 'Diaz',
        birthDate: new Date('1985-11-02'),
        blood: aNeg ?? undefined,
    }, bloodRepo);

    await ensureDonor(donorRepo, donorUser3, {
        document: '1003',
        name: 'Maria',
        lastname: 'Lopez',
        birthDate: new Date('1993-07-15'),
        blood: abPos ?? undefined,
    }, bloodRepo);

    // usar adminUser para un log (evita warning de variable sin usar)
    console.log('Usuario admin existente:', adminUser.email);

    // 7) Entidades de salud
    await ensureHealthEntity(healthRepo, entityUser, {
        nit: '900123456-1',
        name: 'Hospital Central',
        address: 'Calle 1 #2-03',
        city: 'Bogota',
        phone: '6012345678',
        email: entityUser.email,
        institutionType: InstitutionType.HOSPITAL,
    });

    await ensureHealthEntity(healthRepo, entityUser2, {
        nit: '900987654-2',
        name: 'Clinica Salud',
        address: 'Carrera 10 #4-05',
        city: 'Medellin',
        phone: '6045678901',
        email: entityUser2.email,
        institutionType: InstitutionType.CLINIC,
    });

    console.log('Seed completado');
    await AppDataSource.destroy();
}

seed().catch(async (err) => {
    console.error('Error en el seed:', err);
    try {
        await AppDataSource.destroy();
    } catch {
        // intentionally left blank
    }
    process.exit(1);
});
