import { Test, TestingModule } from '@nestjs/testing';
import { RolesService } from './roles.service';
import { PermissionsService } from './permissions.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Role } from '../entities/role.entity';
import { NotFoundException } from '@nestjs/common';

describe('RolesService', () => {
  let rolesService: RolesService;
  let permissionsService: PermissionsService;
  let roleRepository: Repository<Role>;

  // Mock data
  const mockPermission1 = {
    id: 1,
    name: 'read:users',
  };

  const mockPermission2 = {
    id: 2,
    name: 'write:users',
  };

  const mockPermission3 = {
    id: 3,
    name: 'delete:users',
  };

  const mockRole = {
    id: 1,
    name: 'admin',
    permissions: [mockPermission1, mockPermission2],
  };

  const mockRoles = [
    mockRole,
    {
      id: 2,
      name: 'user',
      permissions: [mockPermission1],
    },
  ];

  // Mock functions
  const mockCreate = jest.fn();
  const mockSave = jest.fn();
  const mockFind = jest.fn();
  const mockFindOne = jest.fn();
  const mockFindOneBy = jest.fn();
  const mockUpdate = jest.fn();
  const mockDelete = jest.fn();
  const mockPermissionFindOne = jest.fn();

  const mockRoleRepository = {
    create: mockCreate,
    save: mockSave,
    find: mockFind,
    findOne: mockFindOne,
    findOneBy: mockFindOneBy,
    update: mockUpdate,
    delete: mockDelete,
  };

  const mockPermissionsService = {
    findOne: mockPermissionFindOne,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        {
          provide: PermissionsService,
          useValue: mockPermissionsService,
        },
        {
          provide: getRepositoryToken(Role),
          useValue: mockRoleRepository,
        },
      ],
    }).compile();

    rolesService = module.get<RolesService>(RolesService);
    permissionsService = module.get<PermissionsService>(PermissionsService);
    roleRepository = module.get<Repository<Role>>(getRepositoryToken(Role));

    // Limpiar mocks antes de cada test
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createRoleDto = {
      name: 'moderator',
    };

    it('should create a new role successfully', async () => {
      // Arrange
      const newRole = {
        id: 3,
        name: createRoleDto.name,
        permissions: [],
      };

      mockCreate.mockReturnValue(newRole);
      mockSave.mockResolvedValue(newRole);

      // Act
      const result = await rolesService.create(createRoleDto);

      // Assert
      expect(mockCreate).toHaveBeenCalledWith(createRoleDto);
      expect(mockSave).toHaveBeenCalledWith(newRole);
      expect(result).toEqual(newRole);
    });
  });

  describe('findAll', () => {
    it('should return all roles', async () => {
      // Arrange
      mockFind.mockResolvedValue(mockRoles);

      // Act
      const result = await rolesService.findAll();

      // Assert
      expect(mockFind).toHaveBeenCalled();
      expect(result).toEqual(mockRoles);
      expect(result).toHaveLength(2);
    });

    it('should throw NotFoundException when no roles are found', async () => {
      // Arrange
      mockFind.mockResolvedValue([]);

      // Act & Assert
      await expect(rolesService.findAll()).rejects.toThrow(NotFoundException);
      await expect(rolesService.findAll()).rejects.toThrow('No roles found');
      expect(mockFind).toHaveBeenCalled();
    });

    it('should throw NotFoundException when roles is null', async () => {
      // Arrange
      mockFind.mockResolvedValue(null);

      // Act & Assert
      await expect(rolesService.findAll()).rejects.toThrow(NotFoundException);
      await expect(rolesService.findAll()).rejects.toThrow('No roles found');
    });
  });

  describe('findOne', () => {
    it('should return a role by id', async () => {
      // Arrange
      const roleId = 1;
      mockFindOneBy.mockResolvedValue(mockRole);

      // Act
      const result = await rolesService.findOne(roleId);

      // Assert
      expect(mockFindOneBy).toHaveBeenCalledWith({ id: roleId });
      expect(result).toEqual(mockRole);
    });

    it('should throw NotFoundException when role is not found', async () => {
      // Arrange
      const roleId = 999;
      mockFindOneBy.mockResolvedValue(null);

      // Act & Assert
      await expect(rolesService.findOne(roleId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(rolesService.findOne(roleId)).rejects.toThrow(
        'Role not found',
      );
      expect(mockFindOneBy).toHaveBeenCalledWith({ id: roleId });
    });
  });

  describe('update', () => {
    const updateRoleDto = {
      name: 'super-admin',
    };

    it('should update a role successfully', async () => {
      // Arrange
      const roleId = 1;
      const updatedRole = { ...mockRole, ...updateRoleDto };
      mockUpdate.mockResolvedValue({ affected: 1 });
      mockFindOneBy.mockResolvedValue(updatedRole);

      // Act
      const result = await rolesService.update(roleId, updateRoleDto);

      // Assert
      expect(mockUpdate).toHaveBeenCalledWith(roleId, updateRoleDto);
      expect(mockFindOneBy).toHaveBeenCalledWith({ id: roleId });
      expect(result).toEqual(updatedRole);
    });

    it('should throw NotFoundException when role is not updated', async () => {
      // Arrange
      const roleId = 999;
      mockUpdate.mockResolvedValue({ affected: 0 });

      // Act & Assert
      await expect(rolesService.update(roleId, updateRoleDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(rolesService.update(roleId, updateRoleDto)).rejects.toThrow(
        'Role not updated',
      );
      expect(mockUpdate).toHaveBeenCalledWith(roleId, updateRoleDto);
      expect(mockFindOneBy).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a role successfully', async () => {
      // Arrange
      const roleId = 1;
      mockDelete.mockResolvedValue({ affected: 1 });

      // Act
      const result = await rolesService.remove(roleId);

      // Assert
      expect(mockDelete).toHaveBeenCalledWith(roleId);
      expect(result).toBe(roleId);
    });

    it('should throw NotFoundException when role deletion fails', async () => {
      // Arrange
      const roleId = 999;
      mockDelete.mockResolvedValue({ affected: 0 });

      // Act & Assert
      await expect(rolesService.remove(roleId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(rolesService.remove(roleId)).rejects.toThrow(
        'Role not deleted',
      );
      expect(mockDelete).toHaveBeenCalledWith(roleId);
    });
  });

  describe('findByName', () => {
    it('should return a role by name', async () => {
      // Arrange
      const roleName = 'admin';
      mockFindOneBy.mockResolvedValue(mockRole);

      // Act
      const result = await rolesService.findByName(roleName);

      // Assert
      expect(mockFindOneBy).toHaveBeenCalledWith({ name: roleName });
      expect(result).toEqual(mockRole);
    });

    it('should throw NotFoundException when role is not found by name', async () => {
      // Arrange
      const roleName = 'nonexistent';
      mockFindOneBy.mockResolvedValue(null);

      // Act & Assert
      await expect(rolesService.findByName(roleName)).rejects.toThrow(
        NotFoundException,
      );
      await expect(rolesService.findByName(roleName)).rejects.toThrow(
        'Role not deleted',
      );
      expect(mockFindOneBy).toHaveBeenCalledWith({ name: roleName });
    });
  });

  describe('assignPermissionToRole', () => {
    it('should assign a permission to a role successfully', async () => {
      // Arrange
      const roleId = 1;
      const permissionId = 3;
      const roleWithPermission = {
        ...mockRole,
        permissions: [...mockRole.permissions, mockPermission3],
      };

      mockFindOne.mockResolvedValue(mockRole);
      mockPermissionFindOne.mockResolvedValue(mockPermission3);
      mockSave.mockResolvedValue(roleWithPermission);

      // Act
      const result = await rolesService.assignPermissionToRole(
        roleId,
        permissionId,
      );

      // Assert
      expect(mockFindOne).toHaveBeenCalledWith({ where: { id: roleId } });
      expect(mockPermissionFindOne).toHaveBeenCalledWith(permissionId);
      expect(mockSave).toHaveBeenCalled();
      expect(result).toEqual(roleWithPermission);
    });

    it('should throw NotFoundException when role is not found', async () => {
      // Arrange
      const roleId = 999;
      const permissionId = 1;
      mockFindOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        rolesService.assignPermissionToRole(roleId, permissionId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        rolesService.assignPermissionToRole(roleId, permissionId),
      ).rejects.toThrow('Role not found');
      expect(mockPermissionFindOne).not.toHaveBeenCalled();
      expect(mockSave).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when permission is not found', async () => {
      // Arrange
      const roleId = 1;
      const permissionId = 999;
      mockFindOne.mockResolvedValue(mockRole);
      mockPermissionFindOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        rolesService.assignPermissionToRole(roleId, permissionId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        rolesService.assignPermissionToRole(roleId, permissionId),
      ).rejects.toThrow('Permission not found');
      expect(mockSave).not.toHaveBeenCalled();
    });

    it('should throw Error when permission is already assigned to role', async () => {
      // Arrange
      const roleId = 1;
      const permissionId = 1; // Ya existe en mockRole
      mockFindOne.mockResolvedValue(mockRole);
      mockPermissionFindOne.mockResolvedValue(mockPermission1);

      // Act & Assert
      await expect(
        rolesService.assignPermissionToRole(roleId, permissionId),
      ).rejects.toThrow('Permission already assigned to role');
      expect(mockSave).not.toHaveBeenCalled();
    });
  });

  describe('removePermissionFromRole', () => {
    it('should remove a permission from a role successfully', async () => {
      // Arrange
      const roleId = 1;
      const permissionId = 1;
      const roleWithoutPermission = {
        ...mockRole,
        permissions: [mockPermission2], // Solo queda el permiso 2
      };

      mockFindOne.mockResolvedValue(mockRole);
      mockSave.mockResolvedValue(roleWithoutPermission);

      // Act
      const result = await rolesService.removePermissionFromRole(
        roleId,
        permissionId,
      );

      // Assert
      expect(mockFindOne).toHaveBeenCalledWith({ where: { id: roleId } });
      expect(mockSave).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result?.permissions).toHaveLength(1);
      expect(result?.permissions[0]).toEqual(mockPermission2);
    });

    it('should throw NotFoundException when role is not found', async () => {
      // Arrange
      const roleId = 999;
      const permissionId = 1;
      mockFindOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        rolesService.removePermissionFromRole(roleId, permissionId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        rolesService.removePermissionFromRole(roleId, permissionId),
      ).rejects.toThrow('Role not found');
      expect(mockSave).not.toHaveBeenCalled();
    });
  });

  describe('getRolePermissions', () => {
    it('should return all permissions for a role', async () => {
      // Arrange
      const roleId = 1;
      mockFindOne.mockResolvedValue(mockRole);

      // Act
      const result = await rolesService.getRolePermissions(roleId);

      // Assert
      expect(mockFindOne).toHaveBeenCalledWith({ where: { id: roleId } });
      expect(result).toEqual(mockRole.permissions);
      expect(result).toHaveLength(2);
    });

    it('should throw NotFoundException when role is not found', async () => {
      // Arrange
      const roleId = 999;
      mockFindOne.mockResolvedValue(null);

      // Act & Assert
      await expect(rolesService.getRolePermissions(roleId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(rolesService.getRolePermissions(roleId)).rejects.toThrow(
        'Role not found',
      );
    });
  });

  describe('assignMultiplePermissionsToRole', () => {
    it('should assign multiple permissions to a role successfully', async () => {
      // Arrange
      const roleId = 1;
      const permissionIds = [3]; // Solo el permiso 3 es nuevo
      const roleWithNewPermission = {
        ...mockRole,
        permissions: [...mockRole.permissions, mockPermission3],
      };

      mockFindOne.mockResolvedValue(mockRole);
      mockPermissionFindOne.mockResolvedValue(mockPermission3);
      mockSave.mockResolvedValue(roleWithNewPermission);

      // Act
      const result = await rolesService.assignMultiplePermissionsToRole(
        roleId,
        permissionIds,
      );

      // Assert
      expect(mockFindOne).toHaveBeenCalledWith({
        where: { id: roleId },
        relations: ['permissions'],
      });
      expect(mockPermissionFindOne).toHaveBeenCalledWith(3);
      expect(mockSave).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result?.permissions).toHaveLength(3);
    });

    it('should only add new permissions and skip already assigned ones', async () => {
      // Arrange
      const roleId = 1;
      const permissionIds = [1, 2, 3]; // 1 y 2 ya existen, solo 3 es nuevo
      const roleWithNewPermission = {
        ...mockRole,
        permissions: [...mockRole.permissions, mockPermission3],
      };

      mockFindOne.mockResolvedValue(mockRole);
      mockPermissionFindOne
        .mockResolvedValueOnce(mockPermission1)
        .mockResolvedValueOnce(mockPermission2)
        .mockResolvedValueOnce(mockPermission3);
      mockSave.mockResolvedValue(roleWithNewPermission);

      // Act
      const result = await rolesService.assignMultiplePermissionsToRole(
        roleId,
        permissionIds,
      );

      // Assert
      expect(mockPermissionFindOne).toHaveBeenCalledTimes(3);
      expect(mockSave).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result?.permissions).toHaveLength(3);
    });

    it('should throw Error when role is not found', async () => {
      // Arrange
      const roleId = 999;
      const permissionIds = [1, 2];
      mockFindOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        rolesService.assignMultiplePermissionsToRole(roleId, permissionIds),
      ).rejects.toThrow('Role not found');
      expect(mockPermissionFindOne).not.toHaveBeenCalled();
      expect(mockSave).not.toHaveBeenCalled();
    });

    it('should throw Error when some permissions are not found', async () => {
      // Arrange
      const roleId = 1;
      const permissionIds = [1, 999]; // 999 no existe
      mockFindOne.mockResolvedValue(mockRole);
      mockPermissionFindOne
        .mockResolvedValueOnce(mockPermission1)
        .mockResolvedValueOnce(null);

      // Act & Assert
      await expect(
        rolesService.assignMultiplePermissionsToRole(roleId, permissionIds),
      ).rejects.toThrow('Some permissions were not found');
      expect(mockSave).not.toHaveBeenCalled();
    });
  });

  describe('Service Definition', () => {
    it('should be defined', () => {
      expect(rolesService).toBeDefined();
    });

    it('should have roleRepository injected', () => {
      expect(roleRepository).toBeDefined();
    });

    it('should have permissionsService injected', () => {
      expect(permissionsService).toBeDefined();
    });
  });
});
