import { Test, TestingModule } from '@nestjs/testing';
import { RolesController } from './roles.controller';
import { RolesService } from '../services/roles.service';
import { NotFoundException } from '@nestjs/common';

describe('RolesController', () => {
  let rolesController: RolesController;
  let rolesService: RolesService;

  // Mock data
  const mockPermission1 = { id: 1, name: 'read:users' };
  const mockPermission2 = { id: 2, name: 'write:users' };
  const mockPermission3 = { id: 3, name: 'delete:users' };

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

  const mockCreateRoleDto = {
    name: 'moderator',
  };

  const mockUpdateRoleDto = {
    name: 'super-admin',
  };

  const mockAssignMultiplePermissionsDto = {
    permissionIds: [1, 2, 3],
  };

  // Mock functions
  const mockCreate = jest.fn();
  const mockFindAll = jest.fn();
  const mockFindOne = jest.fn();
  const mockUpdate = jest.fn();
  const mockRemove = jest.fn();
  const mockAssignMultiplePermissionsToRole = jest.fn();
  const mockAssignPermissionToRole = jest.fn();
  const mockRemovePermissionFromRole = jest.fn();
  const mockGetRolePermissions = jest.fn();

  const mockRolesService = {
    create: mockCreate,
    findAll: mockFindAll,
    findOne: mockFindOne,
    update: mockUpdate,
    remove: mockRemove,
    assignMultiplePermissionsToRole: mockAssignMultiplePermissionsToRole,
    assignPermissionToRole: mockAssignPermissionToRole,
    removePermissionFromRole: mockRemovePermissionFromRole,
    getRolePermissions: mockGetRolePermissions,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RolesController],
      providers: [
        {
          provide: RolesService,
          useValue: mockRolesService,
        },
      ],
    }).compile();

    rolesController = module.get<RolesController>(RolesController);
    rolesService = module.get<RolesService>(RolesService);

    // Limpiar mocks antes de cada test
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new role successfully', async () => {
      // Arrange
      const newRole = {
        id: 3,
        name: mockCreateRoleDto.name,
        permissions: [],
      };
      mockCreate.mockResolvedValue(newRole);

      // Act
      const result = await rolesController.create(mockCreateRoleDto);

      // Assert
      expect(mockCreate).toHaveBeenCalledWith(mockCreateRoleDto);
      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(result).toEqual(newRole);
      expect(result).toBeDefined();
      expect(result?.name).toBe(mockCreateRoleDto.name);
    });

    it('should pass the createRoleDto to the service', async () => {
      // Arrange
      const newRole = { id: 4, name: 'editor', permissions: [] };
      mockCreate.mockResolvedValue(newRole);

      // Act
      await rolesController.create({ name: 'editor' });

      // Assert
      expect(mockCreate).toHaveBeenCalledWith({ name: 'editor' });
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'editor' }),
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of roles', async () => {
      // Arrange
      mockFindAll.mockResolvedValue(mockRoles);

      // Act
      const result = await rolesController.findAll();

      // Assert
      expect(mockFindAll).toHaveBeenCalled();
      expect(mockFindAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockRoles);
      expect(result).toHaveLength(2);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should throw NotFoundException when no roles are found', async () => {
      // Arrange
      mockFindAll.mockRejectedValue(new NotFoundException('No roles found'));

      // Act & Assert
      await expect(rolesController.findAll()).rejects.toThrow(
        NotFoundException,
      );
      await expect(rolesController.findAll()).rejects.toThrow(
        'No roles found',
      );
      expect(mockFindAll).toHaveBeenCalled();
    });

    it('should return roles with their permissions', async () => {
      // Arrange
      mockFindAll.mockResolvedValue(mockRoles);

      // Act
      const result = await rolesController.findAll();

      // Assert
      expect(result).toBeDefined();
      expect(result?.[0]).toHaveProperty('permissions');
      expect(result?.[0].permissions).toBeInstanceOf(Array);
    });
  });

  describe('findOne', () => {
    it('should return a role by id', async () => {
      // Arrange
      const roleId = 1;
      mockFindOne.mockResolvedValue(mockRole);

      // Act
      const result = await rolesController.findOne(roleId);

      // Assert
      expect(mockFindOne).toHaveBeenCalledWith(roleId);
      expect(mockFindOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockRole);
      expect(result).toBeDefined();
      expect(result?.id).toBe(roleId);
    });

    it('should throw NotFoundException when role is not found', async () => {
      // Arrange
      const roleId = 999;
      mockFindOne.mockRejectedValue(new NotFoundException('Role not found'));

      // Act & Assert
      await expect(rolesController.findOne(roleId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(rolesController.findOne(roleId)).rejects.toThrow(
        'Role not found',
      );
      expect(mockFindOne).toHaveBeenCalledWith(roleId);
    });

    it('should accept numeric id parameter', async () => {
      // Arrange
      const roleId = 42;
      const expectedRole = { ...mockRole, id: roleId };
      mockFindOne.mockResolvedValue(expectedRole);

      // Act
      const result = await rolesController.findOne(roleId);

      // Assert
      expect(mockFindOne).toHaveBeenCalledWith(42);
      expect(typeof roleId).toBe('number');
      expect(result).toBeDefined();
      expect(result?.id).toBe(roleId);
    });
  });

  describe('update', () => {
    it('should update a role successfully', async () => {
      // Arrange
      const roleId = 1;
      const updatedRole = { ...mockRole, ...mockUpdateRoleDto };
      mockUpdate.mockResolvedValue(updatedRole);

      // Act
      const result = await rolesController.update(roleId, mockUpdateRoleDto);

      // Assert
      expect(mockUpdate).toHaveBeenCalledWith(roleId, mockUpdateRoleDto);
      expect(mockUpdate).toHaveBeenCalledTimes(1);
      expect(result).toEqual(updatedRole);
      expect(result).toBeDefined();
      expect(result?.name).toBe(mockUpdateRoleDto.name);
    });

    it('should throw NotFoundException when role to update is not found', async () => {
      // Arrange
      const roleId = 999;
      mockUpdate.mockRejectedValue(new NotFoundException('Role not updated'));

      // Act & Assert
      await expect(
        rolesController.update(roleId, mockUpdateRoleDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        rolesController.update(roleId, mockUpdateRoleDto),
      ).rejects.toThrow('Role not updated');
      expect(mockUpdate).toHaveBeenCalledWith(roleId, mockUpdateRoleDto);
    });

    it('should pass both id and updateDto to the service', async () => {
      // Arrange
      const roleId = 5;
      const updateDto = { name: 'new-role-name' };
      const updatedRole = { ...mockRole, id: roleId, ...updateDto };
      mockUpdate.mockResolvedValue(updatedRole);

      // Act
      await rolesController.update(roleId, updateDto);

      // Assert
      expect(mockUpdate).toHaveBeenCalledWith(roleId, updateDto);
      expect(mockUpdate).toHaveBeenCalledWith(
        5,
        expect.objectContaining({ name: 'new-role-name' }),
      );
    });
  });

  describe('remove', () => {
    it('should delete a role successfully', async () => {
      // Arrange
      const roleId = 1;
      mockRemove.mockResolvedValue(roleId);

      // Act
      const result = await rolesController.remove(roleId);

      // Assert
      expect(mockRemove).toHaveBeenCalledWith(roleId);
      expect(mockRemove).toHaveBeenCalledTimes(1);
      expect(result).toBe(roleId);
    });

    it('should throw NotFoundException when role deletion fails', async () => {
      // Arrange
      const roleId = 999;
      mockRemove.mockRejectedValue(new NotFoundException('Role not deleted'));

      // Act & Assert
      await expect(rolesController.remove(roleId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(rolesController.remove(roleId)).rejects.toThrow(
        'Role not deleted',
      );
      expect(mockRemove).toHaveBeenCalledWith(roleId);
    });

    it('should return the deleted role id', async () => {
      // Arrange
      const roleId = 7;
      mockRemove.mockResolvedValue(roleId);

      // Act
      const result = await rolesController.remove(roleId);

      // Assert
      expect(result).toBe(7);
      expect(typeof result).toBe('number');
    });
  });

  describe('assignMultiplePermissionsToRole', () => {
    it('should assign multiple permissions to a role successfully', async () => {
      // Arrange
      const roleId = 1;
      const roleWithPermissions = {
        ...mockRole,
        permissions: [mockPermission1, mockPermission2, mockPermission3],
      };
      mockAssignMultiplePermissionsToRole.mockResolvedValue(
        roleWithPermissions,
      );

      // Act
      const result = await rolesController.assignMultiplePermissionsToRole(
        roleId,
        mockAssignMultiplePermissionsDto,
      );

      // Assert
      expect(mockAssignMultiplePermissionsToRole).toHaveBeenCalledWith(
        roleId,
        mockAssignMultiplePermissionsDto.permissionIds,
      );
      expect(mockAssignMultiplePermissionsToRole).toHaveBeenCalledTimes(1);
      expect(result).toEqual(roleWithPermissions);
      expect(result).toBeDefined();
      expect(result?.permissions).toHaveLength(3);
    });

    it('should throw NotFoundException when role is not found', async () => {
      // Arrange
      const roleId = 999;
      mockAssignMultiplePermissionsToRole.mockRejectedValue(
        new Error('Role not found'),
      );

      // Act & Assert
      await expect(
        rolesController.assignMultiplePermissionsToRole(
          roleId,
          mockAssignMultiplePermissionsDto,
        ),
      ).rejects.toThrow('Role not found');
      expect(mockAssignMultiplePermissionsToRole).toHaveBeenCalledWith(
        roleId,
        mockAssignMultiplePermissionsDto.permissionIds,
      );
    });

    it('should throw Error when some permissions are not found', async () => {
      // Arrange
      const roleId = 1;
      mockAssignMultiplePermissionsToRole.mockRejectedValue(
        new Error('Some permissions were not found'),
      );

      // Act & Assert
      await expect(
        rolesController.assignMultiplePermissionsToRole(
          roleId,
          mockAssignMultiplePermissionsDto,
        ),
      ).rejects.toThrow('Some permissions were not found');
    });
  });

  describe('assignPermissionToRole', () => {
    it('should assign a permission to a role successfully', async () => {
      // Arrange
      const roleId = 1;
      const permissionId = 3;
      const roleWithNewPermission = {
        ...mockRole,
        permissions: [...mockRole.permissions, mockPermission3],
      };
      mockAssignPermissionToRole.mockResolvedValue(roleWithNewPermission);

      // Act
      const result = await rolesController.assignPermissionToRole(
        roleId,
        permissionId,
      );

      // Assert
      expect(mockAssignPermissionToRole).toHaveBeenCalledWith(
        roleId,
        permissionId,
      );
      expect(mockAssignPermissionToRole).toHaveBeenCalledTimes(1);
      expect(result).toEqual(roleWithNewPermission);
      expect(result).toBeDefined();
      expect(result?.permissions).toHaveLength(3);
    });

    it('should throw NotFoundException when role is not found', async () => {
      // Arrange
      const roleId = 999;
      const permissionId = 1;
      mockAssignPermissionToRole.mockRejectedValue(
        new NotFoundException('Role not found'),
      );

      // Act & Assert
      await expect(
        rolesController.assignPermissionToRole(roleId, permissionId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        rolesController.assignPermissionToRole(roleId, permissionId),
      ).rejects.toThrow('Role not found');
    });

    it('should throw NotFoundException when permission is not found', async () => {
      // Arrange
      const roleId = 1;
      const permissionId = 999;
      mockAssignPermissionToRole.mockRejectedValue(
        new NotFoundException('Permission not found'),
      );

      // Act & Assert
      await expect(
        rolesController.assignPermissionToRole(roleId, permissionId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        rolesController.assignPermissionToRole(roleId, permissionId),
      ).rejects.toThrow('Permission not found');
    });

    it('should throw Error when permission is already assigned', async () => {
      // Arrange
      const roleId = 1;
      const permissionId = 1;
      mockAssignPermissionToRole.mockRejectedValue(
        new Error('Permission already assigned to role'),
      );

      // Act & Assert
      await expect(
        rolesController.assignPermissionToRole(roleId, permissionId),
      ).rejects.toThrow('Permission already assigned to role');
    });
  });

  describe('removePermissionFromRole', () => {
    it('should remove a permission from a role successfully', async () => {
      // Arrange
      const roleId = 1;
      const permissionId = 1;
      const roleWithoutPermission = {
        ...mockRole,
        permissions: [mockPermission2],
      };
      mockRemovePermissionFromRole.mockResolvedValue(roleWithoutPermission);

      // Act
      const result = await rolesController.removePermissionFromRole(
        roleId,
        permissionId,
      );

      // Assert
      expect(mockRemovePermissionFromRole).toHaveBeenCalledWith(
        roleId,
        permissionId,
      );
      expect(mockRemovePermissionFromRole).toHaveBeenCalledTimes(1);
      expect(result).toEqual(roleWithoutPermission);
      expect(result).toBeDefined();
      expect(result?.permissions).toHaveLength(1);
    });

    it('should throw NotFoundException when role is not found', async () => {
      // Arrange
      const roleId = 999;
      const permissionId = 1;
      mockRemovePermissionFromRole.mockRejectedValue(
        new NotFoundException('Role not found'),
      );

      // Act & Assert
      await expect(
        rolesController.removePermissionFromRole(roleId, permissionId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        rolesController.removePermissionFromRole(roleId, permissionId),
      ).rejects.toThrow('Role not found');
      expect(mockRemovePermissionFromRole).toHaveBeenCalledWith(
        roleId,
        permissionId,
      );
    });

    it('should handle removal of non-existent permission gracefully', async () => {
      // Arrange
      const roleId = 1;
      const permissionId = 999;
      mockRemovePermissionFromRole.mockResolvedValue(mockRole);

      // Act
      const result = await rolesController.removePermissionFromRole(
        roleId,
        permissionId,
      );

      // Assert
      expect(mockRemovePermissionFromRole).toHaveBeenCalledWith(
        roleId,
        permissionId,
      );
      expect(result).toBeDefined();
    });
  });

  describe('getRolePermissions', () => {
    it('should return all permissions for a role', async () => {
      // Arrange
      const roleId = 1;
      const permissions = [mockPermission1, mockPermission2];
      mockGetRolePermissions.mockResolvedValue(permissions);

      // Act
      const result = await rolesController.getRolePermissions(roleId);

      // Assert
      expect(mockGetRolePermissions).toHaveBeenCalledWith(roleId);
      expect(mockGetRolePermissions).toHaveBeenCalledTimes(1);
      expect(result).toEqual(permissions);
      expect(result).toHaveLength(2);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should throw NotFoundException when role is not found', async () => {
      // Arrange
      const roleId = 999;
      mockGetRolePermissions.mockRejectedValue(
        new NotFoundException('Role not found'),
      );

      // Act & Assert
      await expect(rolesController.getRolePermissions(roleId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(rolesController.getRolePermissions(roleId)).rejects.toThrow(
        'Role not found',
      );
      expect(mockGetRolePermissions).toHaveBeenCalledWith(roleId);
    });

    it('should return an empty array when role has no permissions', async () => {
      // Arrange
      const roleId = 2;
      mockGetRolePermissions.mockResolvedValue([]);

      // Act
      const result = await rolesController.getRolePermissions(roleId);

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Controller Definition', () => {
    it('should be defined', () => {
      expect(rolesController).toBeDefined();
    });

    it('should have rolesService injected', () => {
      expect(rolesService).toBeDefined();
    });

    it('should have all CRUD methods defined', () => {
      expect(typeof rolesController.create).toBe('function');
      expect(typeof rolesController.findAll).toBe('function');
      expect(typeof rolesController.findOne).toBe('function');
      expect(typeof rolesController.update).toBe('function');
      expect(typeof rolesController.remove).toBe('function');
    });

    it('should have all permission management methods defined', () => {
      expect(typeof rolesController.assignMultiplePermissionsToRole).toBe(
        'function',
      );
      expect(typeof rolesController.assignPermissionToRole).toBe('function');
      expect(typeof rolesController.removePermissionFromRole).toBe('function');
      expect(typeof rolesController.getRolePermissions).toBe('function');
    });
  });
});
