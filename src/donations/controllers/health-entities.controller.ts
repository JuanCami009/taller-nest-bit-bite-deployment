import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { HealthEntitiesService } from '../services/health-entities.service';
import { CreateHealthEntityDto } from '../dto/health-entities/create-health-entity.dto';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../../common/guards/permission.guard';
import { Permissions } from '../../common/decorators/permission.decorator';
import { UpdateHealthEntityDto } from '../dto/health-entities/update-health-entity.dto';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('health-entities')
@ApiBearerAuth()
@Controller('health-entities')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class HealthEntitiesController {
    constructor(private readonly healthEntitiesService: HealthEntitiesService) {}

    @ApiOperation({ summary: 'Create a new health entity' })
    @ApiResponse({ status: 201, description: 'The health entity has been successfully created.' })
    @ApiBody({ type: CreateHealthEntityDto })
    @Post()
    @Permissions('health_entity_create')
    create(@Body() createHealthEntityDto: CreateHealthEntityDto) {
        return this.healthEntitiesService.create(createHealthEntityDto);
    }

    @ApiOperation({ summary: 'Get all health entities' })
    @ApiResponse({ status: 200, description: 'List of all health entities.' })
    @Get()
    @Permissions('health_entity_read')
    findAll() {
        return this.healthEntitiesService.findAll();
    }

    @ApiOperation({ summary: 'Get a health entity by ID' })
    @ApiResponse({ status: 200, description: 'The health entity with the given ID.' })
    @ApiParam({ name: 'id', type: Number, description: 'The ID of the health entity' })
    @Get(':id')
    @Permissions('health_entity_read')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.healthEntitiesService.findOne(id);
    }

    @ApiOperation({ summary: 'Update a health entity by ID' })
    @ApiResponse({ status: 200, description: 'The health entity has been successfully updated.' })
    @ApiParam({ name: 'id', type: Number, description: 'The ID of the health entity' })
    @ApiBody({ type: UpdateHealthEntityDto })
    @Patch(':id')
    @Permissions('health_entity_update')
    update(@Param('id', ParseIntPipe) id: number, @Body() updateHealthEntityDto: UpdateHealthEntityDto) {
        return this.healthEntitiesService.update(id, updateHealthEntityDto);
    }

    @ApiOperation({ summary: 'Delete a health entity by ID' })
    @ApiResponse({ status: 200, description: 'The health entity has been successfully deleted.' })
    @ApiParam({ name: 'id', type: Number, description: 'The ID of the health entity' })
    @Delete(':id')
    @Permissions('health_entity_delete')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.healthEntitiesService.remove(id);
    }
}
