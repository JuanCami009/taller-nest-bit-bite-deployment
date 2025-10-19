import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { PermissionsService } from '../services/permissions.service';
import { CreatePermissionDto } from '../dtos/permissions/create-permission.dto';
import { UpdatePermissionDto } from '../dtos/permissions/update-permission.dto';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../../common/guards/permission.guard';
import { Permissions } from '../../common/decorators/permission.decorator';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('permissions')
@ApiBearerAuth()
@Controller('permissions')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @ApiOperation({ summary: 'Create a new permission' })
  @ApiResponse({ status: 201, description: 'The permission has been successfully created.' })
  @ApiBody({ type: CreatePermissionDto })
  @Post()
  @Permissions('permission_create')
  create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionsService.create(createPermissionDto);
  }

  @ApiOperation({ summary: 'Get all permissions' })
  @ApiResponse({ status: 200, description: 'List of all permissions.' })
  @Get()
  @Permissions('permission_read')
  findAll() {
    return this.permissionsService.findAll();
  }

  @ApiOperation({ summary: 'Get a permission by ID' })
  @ApiResponse({ status: 200, description: 'The permission with the given ID.' })
  @ApiParam({ name: 'id', type: Number, description: 'The ID of the permission' })
  @Get(':id')
  @Permissions('permission_read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.permissionsService.findOne(id);
  }

  @ApiOperation({ summary: 'Update a permission by ID' })
  @ApiResponse({ status: 200, description: 'The permission has been successfully updated.' })
  @ApiParam({ name: 'id', type: Number, description: 'The ID of the permission' })
  @ApiBody({ type: UpdatePermissionDto })
  @Patch(':id')
  @Permissions('permission_update')
  update(@Param('id', ParseIntPipe) id: number, @Body() updatePermissionDto: UpdatePermissionDto) {
    return this.permissionsService.update(id, updatePermissionDto);
  }

  @ApiOperation({ summary: 'Delete a permission by ID' })
  @ApiResponse({ status: 200, description: 'The permission has been successfully deleted.' })
  @ApiParam({ name: 'id', type: Number, description: 'The ID of the permission' })
  @Delete(':id')
  @Permissions('permission_delete')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.permissionsService.remove(id);
  }
}
