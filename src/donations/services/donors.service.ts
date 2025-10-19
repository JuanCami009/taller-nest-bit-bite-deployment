import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Donor } from '../entities/donor.entity';
import { Repository } from 'typeorm';
import { UsersService } from '../../auth/services/users.service';
import { CreateDonorDto } from '../dto/donors/create-donor.dto';
import { BloodsService } from './bloods.service';
import { UpdateDonorDto } from '../dto/donors/update-donor.dto';

@Injectable()
export class DonorsService {
    constructor(
        @InjectRepository(Donor)
        private readonly donorRepository: Repository<Donor>,
        private readonly usersService: UsersService,
        private readonly bloodsService: BloodsService,
    ) {}

    async create(createDonorDto: CreateDonorDto): Promise<Donor> {
        const user = await this.usersService.findOne(createDonorDto.userId);

        const blood = await this.bloodsService.findOne(createDonorDto.bloodId);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (!blood) {
            throw new NotFoundException('Blood type not found');
        }

        const { hasAnyProfile, hasHealthEntity } =
            await this.usersService.checkUserProfiles(user.id);

        if (hasAnyProfile) {
            throw new NotFoundException('User already has a donor profile');
        }

        if (hasHealthEntity) {
            throw new NotFoundException(
                'User already has a health entity profile',
            );
        }

        const newDonor = this.donorRepository.create({
            ...createDonorDto,
            user,
            blood,
        });

        return await this.donorRepository.save(newDonor);
    }

    async findAll(): Promise<Donor[] | null> {
        const donors = await this.donorRepository.find();

        if (!donors || donors.length === 0)
            throw new NotFoundException('No users found');

        return donors;
    }

    async findOne(id: number): Promise<Donor | null> {
        const donor = await this.donorRepository.findOne({ where: { id } });

        if (!donor) throw new NotFoundException('Donor not found');

        return donor;
    }

    async update(
        id: number,
        updateDonorDto: UpdateDonorDto,
    ): Promise<Donor | null> {
        const result = await this.donorRepository.update(id, updateDonorDto);

        if (result.affected === 0) throw new NotFoundException('Donor not updated');

        return this.findOne(id);
    }

    async remove(id: number): Promise<number> {
        const donor = await this.findOne(id);

        if (!donor) throw new NotFoundException('Donor not found');

        const userId = donor.user.id;

        const result = await this.donorRepository.delete(id);

        if (result.affected === 0) throw new NotFoundException('Donor not deleted');

        const userDeleted = await this.usersService.remove(userId);

        if (!userDeleted) throw new NotFoundException('User not found');

        return id;
    }
}
