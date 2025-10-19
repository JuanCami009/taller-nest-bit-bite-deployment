import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../../common/guards/permission.guard';
import { BloodsService } from '../services/bloods.service';
import { Permissions } from '../../common/decorators/permission.decorator';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('bloods')
@ApiBearerAuth()
@Controller('bloods')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class BloodsController {

    constructor(private readonly bloodsService: BloodsService) { }

    @ApiOperation({ summary: 'Get all blood types' })
    @ApiResponse({ status: 200, description: 'List of all blood types.' })
    @Get()
    @Permissions('blood_read')
    findAll() {
        return this.bloodsService.findAll();
    }

    @ApiOperation({ summary: 'Get a blood type by ID' })
    @ApiResponse({ status: 200, description: 'The blood type with the given ID.' })
    @ApiParam({ name: 'id', type: Number, description: 'The ID of the blood type' })
    @Get(':id')
    @Permissions('blood_read')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.bloodsService.findOne(id);
    }

}
