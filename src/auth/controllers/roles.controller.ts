import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { CreateRoleDto } from '../dtos/roles/create-role.dto';
import { UpdateRoleDto } from '../dtos/roles/update-role.dto';
import { RolesService } from '../services/roles.service';
import { AssignMultiplePermissionsDto } from '../dtos/roles/assign-permission.dto';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../../common/guards/permission.guard';
import { Permissions } from '../../common/decorators/permission.decorator';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('roles')
@ApiBearerAuth()
@Controller('roles')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({ status: 201, description: 'The role has been successfully created.' })
  @ApiBody({ type: CreateRoleDto })
  @Post()
  @Permissions('role_create')
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({ status: 200, description: 'List of all roles.' })
  @Get()
  @Permissions('role_read')
  findAll() {
    return this.rolesService.findAll();
  }

  @ApiOperation({ summary: 'Get a role by ID' })
  @ApiResponse({ status: 200, description: 'The role with the given ID.' })
  @ApiParam({ name: 'id', type: Number, description: 'The ID of the role' })
  @Get(':id')
  @Permissions('role_read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.findOne(id);
  }

  @ApiOperation({ summary: 'Update a role by ID' })
  @ApiResponse({ status: 200, description: 'The role has been successfully updated.' })
  @ApiParam({ name: 'id', type: Number, description: 'The ID of the role' })
  @ApiBody({ type: UpdateRoleDto })
  @Patch(':id')
  @Permissions('role_update')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @ApiOperation({ summary: 'Delete a role by ID' })
  @ApiResponse({ status: 200, description: 'The role has been successfully deleted.' })
  @ApiParam({ name: 'id', type: Number, description: 'The ID of the role' })
  @Delete(':id')
  @Permissions('role_delete')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.remove(id);
  }

  @ApiOperation({ summary: 'Assign multiple permissions to a role' })
  @ApiResponse({ status: 200, description: 'The permissions have been successfully assigned to the role.' })
  @ApiParam({ name: 'id', type: Number, description: 'The ID of the role' })
  @ApiBody({ type: AssignMultiplePermissionsDto })
  @Post(':id/permissions/multiple')
  @Permissions('role_update')
  assignMultiplePermissionsToRole(
      @Param('id', ParseIntPipe) id: number,
      @Body() assignMultiplePermissionsDto: AssignMultiplePermissionsDto,
  ) {
      return this.rolesService.assignMultiplePermissionsToRole(
          id,
          assignMultiplePermissionsDto.permissionIds,
      );
  }

  @ApiOperation({ summary: 'Assign a permission to a role' })
  @ApiResponse({ status: 200, description: 'The permission has been successfully assigned to the role.' })
  @ApiParam({ name: 'id', type: Number, description: 'The ID of the role' })
  @ApiParam({ name: 'permissionId', type: Number, description: 'The ID of the permission to assign' })
  @Post(':id/permissions/:permissionId')
  @Permissions('role_update')
  assignPermissionToRole(@Param('id', ParseIntPipe) id: number, @Param('permissionId', ParseIntPipe) permissionId: number) {
    return this.rolesService.assignPermissionToRole(id, permissionId);
  }

  @ApiOperation({ summary: 'Remove a permission from a role' })
  @ApiResponse({ status: 200, description: 'The permission has been successfully removed from the role.' })
  @ApiParam({ name: 'id', type: Number, description: 'The ID of the role' })
  @ApiParam({ name: 'permissionId', type: Number, description: 'The ID of the permission to remove' })
  @Delete(':id/permissions/:permissionId')
  @Permissions('role_update')
  removePermissionFromRole(@Param('id', ParseIntPipe) id: number, @Param('permissionId', ParseIntPipe) permissionId: number) {
    return this.rolesService.removePermissionFromRole(id, permissionId);
  }


  @ApiOperation({ summary: 'Get all permissions assigned to a role' })
  @ApiResponse({ status: 200, description: 'List of permissions assigned to the role.' })
  @ApiParam({ name: 'id', type: Number, description: 'The ID of the role' })
  @Get(':id/permissions')
  @Permissions('role_read')
  getRolePermissions(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.getRolePermissions(id);
  }
  
}
