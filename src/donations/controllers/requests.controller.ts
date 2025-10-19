import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../../common/guards/permission.guard';
import { RequestsService } from '../services/requests.service';
import { CreateRequestDto } from '../dto/requests/create-request.dto';
import { UpdateRequestDto } from '../dto/requests/update-request.dto';
import { Permissions } from '../../common/decorators/permission.decorator';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('requests')
@ApiBearerAuth()
@Controller('requests')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class RequestsController {
    constructor(private readonly requestsService: RequestsService) {}

    @ApiOperation({ summary: 'Create a new request' })
    @ApiResponse({ status: 201, description: 'The request has been successfully created.' })
    @ApiBody({ type: CreateRequestDto })
    @Post()
    @Permissions('request_create')
    create(@Body() createRequestDto: CreateRequestDto) {
        return this.requestsService.create(createRequestDto);
    }

    @ApiOperation({ summary: 'Get all requests' })
    @ApiResponse({ status: 200, description: 'List of all requests.' })
    @Get()
    @Permissions('request_read')
    findAll() {
        return this.requestsService.findAll();
    }

    @ApiOperation({ summary: 'Get a request by ID' })
    @ApiResponse({ status: 200, description: 'The request with the given ID.' })
    @ApiParam({ name: 'id', type: Number, description: 'The ID of the request' })
    @Get(':id')
    @Permissions('request_read')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.requestsService.findOne(id);
    }

    @ApiOperation({ summary: 'Update a request by ID' })
    @ApiResponse({ status: 200, description: 'The request has been successfully updated.' })
    @ApiParam({ name: 'id', type: Number, description: 'The ID of the request' })
    @ApiBody({ type: UpdateRequestDto })
    @Patch(':id')
    @Permissions('request_update')
    update(@Param('id', ParseIntPipe) id: number, @Body() updateRequestDto: UpdateRequestDto) {
        return this.requestsService.update(id, updateRequestDto);
    }

    @ApiOperation({ summary: 'Delete a request by ID' })
    @ApiResponse({ status: 200, description: 'The request has been successfully deleted.' })
    @ApiParam({ name: 'id', type: Number, description: 'The ID of the request' })
    @Delete(':id')
    @Permissions('request_delete')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.requestsService.remove(id);
    }

}
