import {
    BadRequestException,
    forwardRef,
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
    HealthEntity,
    InstitutionType,
} from '../entities/health-entity.entity';
import { Repository } from 'typeorm';
import { CreateHealthEntityDto } from '../dto/health-entities/create-health-entity.dto';
import { UsersService } from '../../auth/services/users.service';
import { UpdateHealthEntityDto } from '../dto/health-entities/update-health-entity.dto';
import { RequestsService } from './requests.service';
import { BloodBagsService } from './blood-bags.service';

@Injectable()
export class HealthEntitiesService {
    constructor(
        @InjectRepository(HealthEntity)
        private readonly healthEntityRepository: Repository<HealthEntity>,
        private readonly usersService: UsersService,
        @Inject(forwardRef(() => RequestsService))
        private readonly requestsService: RequestsService,
        private readonly bloodBagsService: BloodBagsService,
    ) {}

    async create(
        createHealthEntityDto: CreateHealthEntityDto,
    ): Promise<HealthEntity> {
        const user = await this.usersService.findOne(
            createHealthEntityDto.userId,
        );

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const { hasAnyProfile, hasDonor } =
            await this.usersService.checkUserProfiles(user.id);

        if (hasAnyProfile) {
            throw new NotFoundException(
                'User already has a health entity profile',
            );
        }

        if (hasDonor) {
            throw new NotFoundException('User already has a donor profile');
        }

        const institutionType =
            createHealthEntityDto.institutionType.toLowerCase();

        if (
            !Object.values(InstitutionType).includes(
                institutionType as InstitutionType,
            )
        ) {
            throw new BadRequestException(
                `Invalid institution type. Allowed values: ${Object.values(InstitutionType).join(', ')}`,
            );
        }

        const newHealthEntity = this.healthEntityRepository.create({
            ...createHealthEntityDto,
            institutionType: institutionType as InstitutionType,
            user,
        });

        return await this.healthEntityRepository.save(newHealthEntity);
    }

    async findAll(): Promise<HealthEntity[] | null> {
        const healthEntities = await this.healthEntityRepository.find();

        if (!healthEntities || healthEntities.length === 0)
            throw new NotFoundException('No health entities found');

        return healthEntities;
    }

    async findOne(id: number): Promise<HealthEntity | null> {
        const healthEntity = await this.healthEntityRepository.findOne({
            where: { id },
        });

        if (!healthEntity)
            throw new NotFoundException('Health entity not found');

        return healthEntity;
    }

    async update(
        id: number,
        updateHealthEntityDto: UpdateHealthEntityDto,
    ): Promise<HealthEntity | null> {
        const result = await this.healthEntityRepository.update(
            id,
            updateHealthEntityDto,
        );

        if (result.affected === 0)
            throw new NotFoundException('Health entity not updated');

        return this.findOne(id);
    }

    async remove(id: number): Promise<number> {
        const entity = await this.findOne(id);

        if (!entity) throw new NotFoundException('Health entity not found');

        const userId = entity.user.id;

        // Obtener todas las requests asociadas a esta health entity
        const requests = await this.requestsService.findByHealthEntityId(id);

        // Para cada request, eliminar primero sus blood bags asociadas
        for (const request of requests) {
            await this.bloodBagsService.removeByRequestId(request.id);
        }

        // Ahora eliminar todas las requests
        await this.requestsService.removeByHealthEntityId(id);

        // Ahora eliminar la health entity
        const result = await this.healthEntityRepository.delete(id);

        if (result.affected === 0)
            throw new NotFoundException('Health entity not deleted');

        // Finalmente eliminar el usuario asociado
        const userDeleted = await this.usersService.remove(userId);

        if (!userDeleted) throw new NotFoundException('User not found');

        return id;
    }
}
