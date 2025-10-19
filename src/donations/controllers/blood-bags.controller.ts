import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../../common/guards/permission.guard';
import { Permissions } from '../../common/decorators/permission.decorator';
import { CreateBloodBagDto } from '../dto/blood-bags/create-blood-bag.dto';
import { BloodBagsService } from '../services/blood-bags.service';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdateBloodBagDto } from '../dto/blood-bags/update-blood-bag.dto';

@ApiTags('blood-bags')
@ApiBearerAuth()
@Controller('blood-bags')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class BloodBagsController {
    constructor(private readonly bloodBagsService: BloodBagsService) {}

    @ApiOperation({ summary: 'Create a new blood bag' })
    @ApiResponse({ status: 201, description: 'The blood bag has been successfully created.' })
    @ApiBody({ type: CreateBloodBagDto })
    @Post()
    @Permissions('blood_create')
    create(@Body() createBloodBagDto: CreateBloodBagDto) {
        return this.bloodBagsService.create(createBloodBagDto);
    }

    @ApiOperation({ summary: 'Get all blood bags' })
    @ApiResponse({ status: 200, description: 'List of all blood bags.' })
    @Get()
    @Permissions('blood_read')
    findAll() {
        return this.bloodBagsService.findAll();
    }

    @ApiOperation({ summary: 'Get a blood bag by ID' })
    @ApiResponse({ status: 200, description: 'The blood bag with the given ID.' })
    @ApiParam({ name: 'id', type: Number, description: 'The ID of the blood bag' })
    @Get(':id')
    @Permissions('blood_read')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.bloodBagsService.findOne(id);
    }

    @ApiOperation({ summary: 'Update a blood bag by ID' })
    @ApiResponse({ status: 200, description: 'The blood bag has been successfully updated.' })
    @ApiParam({ name: 'id', type: Number, description: 'The ID of the blood bag' })
    @ApiBody({ type: UpdateBloodBagDto })
    @Patch(':id')
    @Permissions('blood_update')
    update(@Param('id', ParseIntPipe) id: number, @Body() updateBloodBagDto: UpdateBloodBagDto) {
        return this.bloodBagsService.update(id, updateBloodBagDto);
    }

    @ApiOperation({ summary: 'Delete a blood bag by ID' })
    @ApiResponse({ status: 200, description: 'The blood bag has been successfully deleted.' })
    @ApiParam({ name: 'id', type: Number, description: 'The ID of the blood bag' })
    @Delete(':id')
    @Permissions('blood_delete')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.bloodBagsService.remove(id);
    }
}
