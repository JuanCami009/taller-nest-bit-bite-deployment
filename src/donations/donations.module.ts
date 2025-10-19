import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Request } from './entities/request.entity';
import { BloodBag } from './entities/blood-bag.entity';
import { Blood } from './entities/blood.entity';
import { HealthEntity } from './entities/health-entity.entity';
import { Donor } from './entities/donor.entity';
import { DonorsService } from './services/donors.service';
import { HealthEntitiesService } from './services/health-entities.service';
import { BloodsService } from './services/bloods.service';
import { AuthModule } from '../auth/auth.module';
import { RequestsService } from './services/requests.service';
import { BloodBagsService } from './services/blood-bags.service';
import { RequestsController } from './controllers/requests.controller';
import { BloodBagsController } from './controllers/blood-bags.controller';
import { DonorsController } from './controllers/donors.controller';
import { HealthEntitiesController } from './controllers/health-entities.controller';
import { BloodsController } from './controllers/bloods.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Donor, HealthEntity, Blood, BloodBag, Request]), AuthModule],
  controllers: [RequestsController, BloodBagsController, DonorsController, HealthEntitiesController, BloodsController],
  providers: [DonorsService, HealthEntitiesService, BloodsService, RequestsService, BloodBagsService],
  exports: [DonorsService, HealthEntitiesService, BloodsService, RequestsService, BloodBagsService],
})
export class DonationsModule {}
