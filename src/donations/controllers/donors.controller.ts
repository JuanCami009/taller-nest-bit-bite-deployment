import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { CreateDonorDto } from '../dto/donors/create-donor.dto';
import { UpdateDonorDto } from '../dto/donors/update-donor.dto';
import { DonorsService } from '../services/donors.service';
import { PermissionsGuard } from '../../common/guards/permission.guard';
import { AuthGuard } from '@nestjs/passport';
import { Permissions } from '../../common/decorators/permission.decorator';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('donors')
@ApiBearerAuth()
@Controller('donors')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class DonorsController {
    constructor(private readonly donorsService: DonorsService) {}

    @ApiOperation({ summary: 'Create a new donor' })
    @ApiResponse({ status: 201, description: 'The donor has been successfully created.' })
    @ApiBody({ type: CreateDonorDto })
    @Post()
    @Permissions('donor_create')
    create(@Body() createDonorDto: CreateDonorDto) {
        return this.donorsService.create(createDonorDto);
    }

    @ApiOperation({ summary: 'Get all donors' })
    @ApiResponse({ status: 200, description: 'List of all donors.' })
    @Get()
    @Permissions('donor_read')
    findAll() {
        return this.donorsService.findAll();
    }
    
    @ApiOperation({ summary: 'Get a donor by ID' })
    @ApiResponse({ status: 200, description: 'The donor with the given ID.' })
    @ApiParam({ name: 'id', type: Number, description: 'The ID of the donor' })
    @Get(':id')
    @Permissions('donor_read')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.donorsService.findOne(id);
    }

    @ApiOperation({ summary: 'Update a donor by ID' })
    @ApiResponse({ status: 200, description: 'The donor has been successfully updated.' })
    @ApiParam({ name: 'id', type: Number, description: 'The ID of the donor' })
    @ApiBody({ type: UpdateDonorDto })
    @Patch(':id')
    @Permissions('donor_update')
    update(@Param('id', ParseIntPipe) id: number, @Body() updateDonorDto: UpdateDonorDto) {
        return this.donorsService.update(id, updateDonorDto);
    }

    @ApiOperation({ summary: 'Delete a donor by ID' })
    @ApiResponse({ status: 200, description: 'The donor has been successfully deleted.' })
    @ApiParam({ name: 'id', type: Number, description: 'The ID of the donor' })
    @Delete(':id')
    @Permissions('donor_delete')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.donorsService.remove(id);
    }
}
