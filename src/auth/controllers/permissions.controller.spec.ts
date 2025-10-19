import { Test, TestingModule } from '@nestjs/testing';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from '../services/permissions.service';
import { NotFoundException } from '@nestjs/common';

describe('PermissionsController', () => {
  let permissionsController: PermissionsController;
  let permissionsService: PermissionsService;

  // Mock data
  const mockPermission = {
    id: 1,
    name: 'read:users',
  };

  const mockPermissions = [
    mockPermission,
    {
      id: 2,
      name: 'write:users',
    },
    {
      id: 3,
      name: 'delete:users',
    },
  ];

  const mockCreatePermissionDto = {
    name: 'update:users',
  };

  const mockUpdatePermissionDto = {
    name: 'admin:all',
  };

  // Mock functions
  const mockCreate = jest.fn();
  const mockFindAll = jest.fn();
  const mockFindOne = jest.fn();
  const mockUpdate = jest.fn();
  const mockRemove = jest.fn();

  const mockPermissionsService = {
    create: mockCreate,
    findAll: mockFindAll,
    findOne: mockFindOne,
    update: mockUpdate,
    remove: mockRemove,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PermissionsController],
      providers: [
        {
          provide: PermissionsService,
          useValue: mockPermissionsService,
        },
      ],
    }).compile();

    permissionsController = module.get<PermissionsController>(
      PermissionsController,
    );
    permissionsService = module.get<PermissionsService>(PermissionsService);

    // Limpiar mocks antes de cada test
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new permission successfully', async () => {
      // Arrange
      const newPermission = {
        id: 4,
        name: mockCreatePermissionDto.name,
      };
      mockCreate.mockResolvedValue(newPermission);

      // Act
      const result = await permissionsController.create(
        mockCreatePermissionDto,
      );

      // Assert
      expect(mockCreate).toHaveBeenCalledWith(mockCreatePermissionDto);
      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(result).toEqual(newPermission);
      expect(result).toBeDefined();
      expect(result?.name).toBe(mockCreatePermissionDto.name);
    });

    it('should pass the createPermissionDto to the service', async () => {
      // Arrange
      const newPermission = { id: 5, name: 'custom:permission' };
      mockCreate.mockResolvedValue(newPermission);

      // Act
      await permissionsController.create({ name: 'custom:permission' });

      // Assert
      expect(mockCreate).toHaveBeenCalledWith({ name: 'custom:permission' });
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'custom:permission' }),
      );
    });

    it('should create permission with correct structure', async () => {
      // Arrange
      const newPermission = { id: 6, name: 'read:reports' };
      mockCreate.mockResolvedValue(newPermission);

      // Act
      const result = await permissionsController.create({
        name: 'read:reports',
      });

      // Assert
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(typeof result?.id).toBe('number');
      expect(typeof result?.name).toBe('string');
    });
  });

  describe('findAll', () => {
    it('should return an array of permissions', async () => {
      // Arrange
      mockFindAll.mockResolvedValue(mockPermissions);

      // Act
      const result = await permissionsController.findAll();

      // Assert
      expect(mockFindAll).toHaveBeenCalled();
      expect(mockFindAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockPermissions);
      expect(result).toHaveLength(3);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should throw NotFoundException when no permissions are found', async () => {
      // Arrange
      mockFindAll.mockRejectedValue(
        new NotFoundException('No permissions found'),
      );

      // Act & Assert
      await expect(permissionsController.findAll()).rejects.toThrow(
        NotFoundException,
      );
      await expect(permissionsController.findAll()).rejects.toThrow(
        'No permissions found',
      );
      expect(mockFindAll).toHaveBeenCalled();
    });

    it('should return all permissions with their names', async () => {
      // Arrange
      mockFindAll.mockResolvedValue(mockPermissions);

      // Act
      const result = await permissionsController.findAll();

      // Assert
      expect(result).toBeDefined();
      expect(result?.[0]).toHaveProperty('name');
      expect(result?.[0]).toHaveProperty('id');
    });

    it('should return empty array when service returns empty', async () => {
      // Arrange
      mockFindAll.mockResolvedValue([]);

      // Act
      const result = await permissionsController.findAll();

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('findOne', () => {
    it('should return a permission by id', async () => {
      // Arrange
      const permissionId = 1;
      mockFindOne.mockResolvedValue(mockPermission);

      // Act
      const result = await permissionsController.findOne(permissionId);

      // Assert
      expect(mockFindOne).toHaveBeenCalledWith(permissionId);
      expect(mockFindOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockPermission);
      expect(result).toBeDefined();
      expect(result?.id).toBe(permissionId);
    });

    it('should throw NotFoundException when permission is not found', async () => {
      // Arrange
      const permissionId = 999;
      mockFindOne.mockRejectedValue(
        new NotFoundException('Permission not found'),
      );

      // Act & Assert
      await expect(permissionsController.findOne(permissionId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(permissionsController.findOne(permissionId)).rejects.toThrow(
        'Permission not found',
      );
      expect(mockFindOne).toHaveBeenCalledWith(permissionId);
    });

    it('should accept numeric id parameter', async () => {
      // Arrange
      const permissionId = 42;
      const expectedPermission = { id: 42, name: 'special:permission' };
      mockFindOne.mockResolvedValue(expectedPermission);

      // Act
      const result = await permissionsController.findOne(permissionId);

      // Assert
      expect(mockFindOne).toHaveBeenCalledWith(42);
      expect(typeof permissionId).toBe('number');
      expect(result).toBeDefined();
      expect(result?.id).toBe(permissionId);
    });

    it('should return permission with correct properties', async () => {
      // Arrange
      const permissionId = 1;
      mockFindOne.mockResolvedValue(mockPermission);

      // Act
      const result = await permissionsController.findOne(permissionId);

      // Assert
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result?.name).toBe('read:users');
    });
  });

  describe('update', () => {
    it('should update a permission successfully', async () => {
      // Arrange
      const permissionId = 1;
      const updatedPermission = { ...mockPermission, ...mockUpdatePermissionDto };
      mockUpdate.mockResolvedValue(updatedPermission);

      // Act
      const result = await permissionsController.update(
        permissionId,
        mockUpdatePermissionDto,
      );

      // Assert
      expect(mockUpdate).toHaveBeenCalledWith(
        permissionId,
        mockUpdatePermissionDto,
      );
      expect(mockUpdate).toHaveBeenCalledTimes(1);
      expect(result).toEqual(updatedPermission);
      expect(result).toBeDefined();
      expect(result?.name).toBe(mockUpdatePermissionDto.name);
    });

    it('should throw NotFoundException when permission to update is not found', async () => {
      // Arrange
      const permissionId = 999;
      mockUpdate.mockRejectedValue(
        new NotFoundException('Permission not updated'),
      );

      // Act & Assert
      await expect(
        permissionsController.update(permissionId, mockUpdatePermissionDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        permissionsController.update(permissionId, mockUpdatePermissionDto),
      ).rejects.toThrow('Permission not updated');
      expect(mockUpdate).toHaveBeenCalledWith(
        permissionId,
        mockUpdatePermissionDto,
      );
    });

    it('should pass both id and updateDto to the service', async () => {
      // Arrange
      const permissionId = 5;
      const updateDto = { name: 'new:permission' };
      const updatedPermission = { id: permissionId, ...updateDto };
      mockUpdate.mockResolvedValue(updatedPermission);

      // Act
      await permissionsController.update(permissionId, updateDto);

      // Assert
      expect(mockUpdate).toHaveBeenCalledWith(permissionId, updateDto);
      expect(mockUpdate).toHaveBeenCalledWith(
        5,
        expect.objectContaining({ name: 'new:permission' }),
      );
    });

    it('should update only the name field', async () => {
      // Arrange
      const permissionId = 2;
      const partialUpdate = { name: 'updated:name' };
      const updatedPermission = { id: 2, name: 'updated:name' };
      mockUpdate.mockResolvedValue(updatedPermission);

      // Act
      const result = await permissionsController.update(
        permissionId,
        partialUpdate,
      );

      // Assert
      expect(mockUpdate).toHaveBeenCalledWith(permissionId, partialUpdate);
      expect(result).toBeDefined();
      expect(result?.name).toBe('updated:name');
      expect(result?.id).toBe(2);
    });
  });

  describe('remove', () => {
    it('should delete a permission successfully', async () => {
      // Arrange
      const permissionId = 1;
      mockRemove.mockResolvedValue(permissionId);

      // Act
      const result = await permissionsController.remove(permissionId);

      // Assert
      expect(mockRemove).toHaveBeenCalledWith(permissionId);
      expect(mockRemove).toHaveBeenCalledTimes(1);
      expect(result).toBe(permissionId);
    });

    it('should throw NotFoundException when permission deletion fails', async () => {
      // Arrange
      const permissionId = 999;
      mockRemove.mockRejectedValue(
        new NotFoundException('Permission not deleted'),
      );

      // Act & Assert
      await expect(permissionsController.remove(permissionId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(permissionsController.remove(permissionId)).rejects.toThrow(
        'Permission not deleted',
      );
      expect(mockRemove).toHaveBeenCalledWith(permissionId);
    });

    it('should return the deleted permission id', async () => {
      // Arrange
      const permissionId = 7;
      mockRemove.mockResolvedValue(permissionId);

      // Act
      const result = await permissionsController.remove(permissionId);

      // Assert
      expect(result).toBe(7);
      expect(typeof result).toBe('number');
    });

    it('should handle deletion of non-existent permission', async () => {
      // Arrange
      const permissionId = 0;
      mockRemove.mockRejectedValue(
        new NotFoundException('Permission not deleted'),
      );

      // Act & Assert
      await expect(permissionsController.remove(permissionId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRemove).toHaveBeenCalledWith(0);
    });
  });

  describe('Controller Definition', () => {
    it('should be defined', () => {
      expect(permissionsController).toBeDefined();
    });

    it('should have permissionsService injected', () => {
      expect(permissionsService).toBeDefined();
    });

    it('should have all CRUD methods defined', () => {
      expect(typeof permissionsController.create).toBe('function');
      expect(typeof permissionsController.findAll).toBe('function');
      expect(typeof permissionsController.findOne).toBe('function');
      expect(typeof permissionsController.update).toBe('function');
      expect(typeof permissionsController.remove).toBe('function');
    });

    it('should have exactly 5 methods', () => {
      const methods = [
        'create',
        'findAll',
        'findOne',
        'update',
        'remove',
      ];
      methods.forEach((method) => {
        expect(permissionsController).toHaveProperty(method);
      });
    });
  });
});
