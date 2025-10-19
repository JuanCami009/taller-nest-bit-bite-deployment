import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { RolesService } from './roles.service';
import { CreateUserDto } from '../dtos/users/create-user.dto';
import { UpdateUserDto } from '../dtos/users/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private rolesService: RolesService,
    ) { }

    async create(createUserDto: CreateUserDto): Promise<User | null> {
        const role = await this.rolesService.findByName(createUserDto.roleName);
        if (!role) {
            throw new NotFoundException();
        }

        const existUser = await this.userRepository.findOne({ where: { email: createUserDto.email } });
        
        if (existUser) {
            throw new NotFoundException('User with this email already exists');
        }

        createUserDto.password = await bcrypt.hash(createUserDto.password, 10);

        const newUser = this.userRepository.create({
            ...createUserDto,
            role,
        });

        const user = await this.userRepository.save(newUser);


        return this.findOne(user.id);
    }

    async findAll(): Promise<User[] | null> {
        const users = await this.userRepository.find();

        if (!users || users.length === 0)
            throw new NotFoundException('No users found');

        return users;
    }

    async findOne(id: number): Promise<User | null> {
        const user = await this.userRepository.findOne({ where: { id } });

        if (!user) throw new NotFoundException('User not found');

        return user;
    }

    async update(
        id: number,
        updateUserDto: UpdateUserDto,
    ): Promise<User | null> {
        const result = await this.userRepository.update(id, updateUserDto);

        if (result.affected === 0) throw new NotFoundException('User not updated');

        return this.findOne(id);
    }

    async remove(id: number): Promise<number> {
        // Verificar si el usuario tiene perfiles asociados
        const { hasDonor, hasHealthEntity } = await this.checkUserProfiles(id);

        if (hasDonor) {
            throw new NotFoundException(
                'Cannot delete user: User has an associated donor profile. Delete the donor first.',
            );
        }

        if (hasHealthEntity) {
            throw new NotFoundException(
                'Cannot delete user: User has an associated health entity profile. Delete the health entity first.',
            );
        }

        const result = await this.userRepository.delete(id);

        if (result.affected === 0) throw new NotFoundException('User not deleted');
        return id;
    }

    async findByEmail(email: string): Promise<User | null> {
        const user = await this.userRepository
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.role', 'role')
            .leftJoinAndSelect('role.permissions', 'permissions')
            .addSelect('user.password') 
            .where('user.email = :email', { email })
            .getOne();

        if (!user) throw new NotFoundException('User not found');

        return user;
    }

    async checkUserProfiles(userId: number): Promise<{
        hasDonor: boolean;
        hasHealthEntity: boolean;
        hasAnyProfile: boolean;
    }> {
        const raw = await this.userRepository
            .createQueryBuilder('u')
            .leftJoin('u.donor', 'd')
            .leftJoin('u.healthEntity', 'h')
            .where('u.id = :userId', { userId })
            .select('u.id', 'id')
            .addSelect('COUNT(d.id)', 'donorCount')
            .addSelect('COUNT(h.id)', 'healthEntityCount')
            .groupBy('u.id')
            .getRawOne<{
                id: number;
                donorCount?: string;
                healthEntityCount?: string;
            }>();

        const hasDonor = Number(raw?.donorCount ?? 0) > 0;
        const hasHealthEntity = Number(raw?.healthEntityCount ?? 0) > 0;

        return {
            hasDonor,
            hasHealthEntity,
            hasAnyProfile: hasDonor || hasHealthEntity,
        };
    }
}
