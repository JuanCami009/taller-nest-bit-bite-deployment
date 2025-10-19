import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Blood } from '../entities/blood.entity';
import { Repository } from 'typeorm';

@Injectable()
export class BloodsService {

    constructor(
        @InjectRepository(Blood)
        private readonly bloodRepository: Repository<Blood>,
    ){}

    async findAll(): Promise<Blood[]> {
        const bloods = await this.bloodRepository.find();

        if( !bloods || bloods.length === 0) throw new NotFoundException('No blood types found');
            
        return bloods;
    }

    async findOne(id: number): Promise<Blood | null> {  
        const blood = await this.bloodRepository.findOne({ where: { id } })

        if(!blood) throw new NotFoundException('Blood type not found');

        return blood;
    }


}
