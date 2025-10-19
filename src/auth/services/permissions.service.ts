import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../entities/permission.entity';
import { CreatePermissionDto } from '../dtos/permissions/create-permission.dto';
import { UpdatePermissionDto } from '../dtos/permissions/update-permission.dto';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ){}

  async create(createPermissionDto: CreatePermissionDto): Promise<Permission> {
    const newPermission = this.permissionRepository.create(createPermissionDto);
    return await this.permissionRepository.save(newPermission);
  }

  async findAll(): Promise<Permission[] | null> {
    const permissions = await this.permissionRepository.find();

    if(!permissions) throw new NotFoundException('No permissions found');

    return permissions;
  }

  async findOne(id: number): Promise<Permission | null> {
    const permission = await this.permissionRepository.findOneBy({id});

    if(!permission) throw new NotFoundException('Permission not found');

    return permission;
  }

  async update(id: number, updatePermissionDto: UpdatePermissionDto): Promise<Permission | null>{
    const result = await this.permissionRepository.update(id, updatePermissionDto);

    if(result.affected === 0) throw new NotFoundException('Permission not updated');
    return await this.permissionRepository.findOneBy({id});

  }

  async remove(id: number): Promise<number> {
    const result = await this.permissionRepository.delete(id);

    if(result.affected === 0) throw new NotFoundException('Permission not deleted');

    return id;
  }
}
