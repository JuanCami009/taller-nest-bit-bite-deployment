import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from '../entities/request.entity';
import { Repository } from 'typeorm';
import { HealthEntitiesService } from './health-entities.service';
import { BloodsService } from './bloods.service';
import { CreateRequestDto } from '../dto/requests/create-request.dto';
import { UpdateRequestDto } from '../dto/requests/update-request.dto';

@Injectable()
export class RequestsService {

    constructor(
        @InjectRepository(Request)
        private readonly requestRepository: Repository<Request>,
        @Inject(forwardRef(() => HealthEntitiesService))
        private readonly healthEntitiesService: HealthEntitiesService,
        private readonly bloodsService: BloodsService
    ) { }

    async create(createRequestDto: CreateRequestDto): Promise<Request> {
        const healthEntity = await this.healthEntitiesService.findOne(createRequestDto.healthEntityId);
        const blood = await this.bloodsService.findOne(createRequestDto.bloodId);

        if (!healthEntity) {
            throw new NotFoundException('Health entity not found');
        }

        if (!blood) {
            throw new NotFoundException('Blood type not found');
        }

        if (createRequestDto.quantityNeeded <= 0) {
            throw new BadRequestException('Quantity must be greater than zero');
        }

        if (createRequestDto.dueDate <= new Date()) {
            throw new BadRequestException('Due date must be a future date');
        }

        const newRequest = this.requestRepository.create({
            ...createRequestDto,
            healthEntity,
            blood
        });

        return await this.requestRepository.save(newRequest);
    }

    async findAll(): Promise<Request[] | null> {
        const requests = await this.requestRepository.find();

        if (!requests || requests.length === 0)
            throw new NotFoundException('No users found');

        return requests;
    }

    async findOne(id: number): Promise<Request | null> {
        const request = await this.requestRepository.findOne({ where: { id } });

        if (!request) throw new NotFoundException('Donor not found');

        return request;
    }

    async update(
        id: number,
        updateRequestDto: UpdateRequestDto,
    ): Promise<Request | null> {
        const result = await this.requestRepository.update(id, updateRequestDto);

        if (result.affected === 0) throw new NotFoundException('Request not updated');

        return this.findOne(id);
    }

    async remove(id: number): Promise<number> {
        const result = await this.requestRepository.delete(id);

        if (result.affected === 0) throw new NotFoundException('Request not deleted');

        return id;
    }

    async findByHealthEntityId(healthEntityId: number): Promise<Request[]> {
        return await this.requestRepository.find({
            where: { healthEntity: { id: healthEntityId } },
        });
    }

    async removeByHealthEntityId(healthEntityId: number): Promise<void> {
        await this.requestRepository.delete({ healthEntity: { id: healthEntityId } });
    }
}
