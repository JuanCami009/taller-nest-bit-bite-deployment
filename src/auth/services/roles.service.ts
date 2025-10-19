import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { PermissionsService } from './permissions.service';
import { CreateRoleDto } from '../dtos/roles/create-role.dto';
import { UpdateRoleDto } from '../dtos/roles/update-role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private permissionsService: PermissionsService
  ){}

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    const newRole = this.roleRepository.create(createRoleDto);
    return await this.roleRepository.save(newRole);
  }

  async findAll(): Promise<Role[] | null> {
    const roles = await this.roleRepository.find();

    if(!roles || roles.length === 0) throw new NotFoundException('No roles found');

    return roles;
  }

  async findOne(id: number): Promise<Role | null> {
    const role= await this.roleRepository.findOneBy({ id });

    if(!role) throw new NotFoundException('Role not found');
    
    return role
        
  }

  async update(id: number, updateRoleDto: UpdateRoleDto, ): Promise<Role | null> {
    const result = await this.roleRepository.update(id, updateRoleDto);

    if(result.affected === 0) throw new NotFoundException('Role not updated');
    return await this.roleRepository.findOneBy({ id });
  }

  async remove(id: number): Promise<number> {
    const result = await this.roleRepository.delete(id);

    if(result.affected === 0) throw new NotFoundException('Role not deleted');

    return id;
  }

  async findByName(name: string): Promise<Role | null> {
    const role = await this.roleRepository.findOneBy({ name });

    if(!role) throw new NotFoundException('Role not deleted');

    return role;
  }

  async assignPermissionToRole(roleId: number, permissionId: number): Promise<Role | null> {
      const role = await this.roleRepository.findOne({
          where: { id: roleId },
      });
      
      if (!role) {
          throw new NotFoundException('Role not found');
      }

      const permission = await this.permissionsService.findOne(permissionId);
      if (!permission) {
          throw new NotFoundException('Permission not found');
      }

      const hasPermission = role.permissions.some(p => p.id === permissionId);
      if (hasPermission) {
          throw new Error('Permission already assigned to role');
      }

      role.permissions.push(permission);
      return await this.roleRepository.save(role);
  }

  async removePermissionFromRole(roleId: number, permissionId: number): Promise<Role | null> {
      const role = await this.roleRepository.findOne({
          where: { id: roleId },
      });
      
      if (!role) {
          throw new NotFoundException('Role not found');
      }

      role.permissions = role.permissions.filter(p => p.id !== permissionId);
      return await this.roleRepository.save(role);
  }


  async getRolePermissions(id: number): Promise<Permission[]> {
      const role = await this.roleRepository.findOne({
          where: { id },
      });
      
      if (!role) {
          throw new NotFoundException('Role not found');
      }

      return role.permissions;
  }

  async assignMultiplePermissionsToRole(roleId: number, permissionIds: number[]): Promise<Role | null> {
        const role = await this.roleRepository.findOne({
            where: { id: roleId },
            relations: ['permissions']
        });
        
        if (!role) {
            throw new Error('Role not found');
        }

        const permissions = await Promise.all(
            permissionIds.map(id => this.permissionsService.findOne(id))
        );

        const validPermissions = permissions.filter(p => p !== null);
        
        if (validPermissions.length !== permissionIds.length) {
            throw new Error('Some permissions were not found');
        }

        const newPermissions = validPermissions.filter(
            newPerm => !role.permissions.some(existingPerm => existingPerm.id === newPerm.id)
        );

        role.permissions.push(...newPermissions);
        return await this.roleRepository.save(role);
    }
}
