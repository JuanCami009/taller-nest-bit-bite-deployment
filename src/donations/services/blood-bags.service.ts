import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BloodBag } from '../entities/blood-bag.entity';
import { Repository } from 'typeorm';
import { BloodsService } from './bloods.service';
import { DonorsService } from './donors.service';
import { RequestsService } from './requests.service';
import { CreateBloodBagDto } from '../dto/blood-bags/create-blood-bag.dto';
import { UpdateBloodBagDto } from '../dto/blood-bags/update-blood-bag.dto';

@Injectable()
export class BloodBagsService {
    constructor(
        @InjectRepository(BloodBag)
        private readonly bloodBagsRepository: Repository<BloodBag>,
        private readonly bloodsService: BloodsService,
        private readonly donorsService: DonorsService,
        private readonly requestsService: RequestsService
    ) { }

    async create(createBloodBagDto: CreateBloodBagDto): Promise<BloodBag> {
        const blood = await this.bloodsService.findOne(createBloodBagDto.bloodId);
        const donor = await this.donorsService.findOne(createBloodBagDto.donorId);
        const request = await this.requestsService.findOne(createBloodBagDto.requestId);

        if (!blood) {
            throw new NotFoundException('Blood type not found');
        }

        if (!donor) {
            throw new NotFoundException('Donor not found');
        }

        if (!request) {
            throw new NotFoundException('Request not found');
        }

        if (request.blood.id !== blood.id) {
            throw new BadRequestException('Blood type does not match the request');
        }

        if (createBloodBagDto.quantity < 0) {
            throw new BadRequestException('Quantity must be greater than zero');
        }

        if (createBloodBagDto.expirationDate <= new Date()) {
            throw new BadRequestException('Expiration date must be a future date');
        }

        const newBloodBag = this.bloodBagsRepository.create({
            ...createBloodBagDto,
            blood,
            donor,
            request
        });

        return await this.bloodBagsRepository.save(newBloodBag);
    }

    async findAll(): Promise<BloodBag[] | null> {
        const bloodBags = await this.bloodBagsRepository.find();

        if (!bloodBags || bloodBags.length === 0)
            throw new NotFoundException('No users found');

        return bloodBags;
    }

    async findOne(id: number): Promise<BloodBag | null> {
        const bloodBag = await this.bloodBagsRepository.findOne({ where: { id } });

        if (!bloodBag) throw new NotFoundException('Donor not found');

        return bloodBag;
    }

    async update(
        id: number,
        updateBloodBagDto: UpdateBloodBagDto,
    ): Promise<BloodBag | null> {
        const result = await this.bloodBagsRepository.update(id, updateBloodBagDto);

        if (result.affected === 0) throw new NotFoundException('Blood bag not updated');

        return this.findOne(id);
    }

    async remove(id: number): Promise<number> {
        const result = await this.bloodBagsRepository.delete(id);

        if (result.affected === 0) throw new NotFoundException('Blood bag not deleted');

        return id;
    }

    async removeByRequestId(requestId: number): Promise<void> {
        await this.bloodBagsRepository.delete({ request: { id: requestId } });
    }
}
