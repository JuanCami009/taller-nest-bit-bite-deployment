import { Test, TestingModule } from '@nestjs/testing';
import { PermissionsService } from './permissions.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Permission } from '../entities/permission.entity';
import { NotFoundException } from '@nestjs/common';

describe('PermissionsService', () => {
  let permissionsService: PermissionsService;
  let permissionRepository: Repository<Permission>;

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

  // Mock functions
  const mockCreate = jest.fn();
  const mockSave = jest.fn();
  const mockFind = jest.fn();
  const mockFindOneBy = jest.fn();
  const mockUpdate = jest.fn();
  const mockDelete = jest.fn();

  const mockPermissionRepository = {
    create: mockCreate,
    save: mockSave,
    find: mockFind,
    findOneBy: mockFindOneBy,
    update: mockUpdate,
    delete: mockDelete,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsService,
        {
          provide: getRepositoryToken(Permission),
          useValue: mockPermissionRepository,
        },
      ],
    }).compile();

    permissionsService = module.get<PermissionsService>(PermissionsService);
    permissionRepository = module.get<Repository<Permission>>(
      getRepositoryToken(Permission),
    );

    // Limpiar mocks antes de cada test
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createPermissionDto = {
      name: 'update:users',
    };

    it('should create a new permission successfully', async () => {
      // Arrange
      const newPermission = {
        id: 4,
        name: createPermissionDto.name,
      };

      mockCreate.mockReturnValue(newPermission);
      mockSave.mockResolvedValue(newPermission);

      // Act
      const result = await permissionsService.create(createPermissionDto);

      // Assert
      expect(mockCreate).toHaveBeenCalledWith(createPermissionDto);
      expect(mockSave).toHaveBeenCalledWith(newPermission);
      expect(result).toEqual(newPermission);
      expect(result.name).toBe(createPermissionDto.name);
    });

    it('should create permission with correct structure', async () => {
      // Arrange
      const newPermission = {
        id: 5,
        name: 'admin:all',
      };

      mockCreate.mockReturnValue(newPermission);
      mockSave.mockResolvedValue(newPermission);

      // Act
      const result = await permissionsService.create({ name: 'admin:all' });

      // Assert
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(mockSave).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('should return all permissions', async () => {
      // Arrange
      mockFind.mockResolvedValue(mockPermissions);

      // Act
      const result = await permissionsService.findAll();

      // Assert
      expect(mockFind).toHaveBeenCalled();
      expect(result).toEqual(mockPermissions);
      expect(result).toHaveLength(3);
      expect(result?.[0]).toHaveProperty('name');
    });

    it('should throw NotFoundException when permissions is null', async () => {
      // Arrange
      mockFind.mockResolvedValue(null);

      // Act & Assert
      await expect(permissionsService.findAll()).rejects.toThrow(
        NotFoundException,
      );
      await expect(permissionsService.findAll()).rejects.toThrow(
        'No permissions found',
      );
      expect(mockFind).toHaveBeenCalled();
    });

    it('should return empty array if permissions exist but array is empty', async () => {
      // Arrange
      mockFind.mockResolvedValue([]);

      // Act
      const result = await permissionsService.findAll();

      // Assert
      expect(mockFind).toHaveBeenCalled();
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('should return a permission by id', async () => {
      // Arrange
      const permissionId = 1;
      mockFindOneBy.mockResolvedValue(mockPermission);

      // Act
      const result = await permissionsService.findOne(permissionId);

      // Assert
      expect(mockFindOneBy).toHaveBeenCalledWith({ id: permissionId });
      expect(result).toEqual(mockPermission);
      expect(result?.id).toBe(permissionId);
      expect(result?.name).toBe('read:users');
    });

    it('should throw NotFoundException when permission is not found', async () => {
      // Arrange
      const permissionId = 999;
      mockFindOneBy.mockResolvedValue(null);

      // Act & Assert
      await expect(permissionsService.findOne(permissionId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(permissionsService.findOne(permissionId)).rejects.toThrow(
        'Permission not found',
      );
      expect(mockFindOneBy).toHaveBeenCalledWith({ id: permissionId });
    });

    it('should call findOneBy with correct parameters for different ids', async () => {
      // Arrange
      const permissionId = 42;
      const expectedPermission = { id: 42, name: 'custom:permission' };
      mockFindOneBy.mockResolvedValue(expectedPermission);

      // Act
      const result = await permissionsService.findOne(permissionId);

      // Assert
      expect(mockFindOneBy).toHaveBeenCalledWith({ id: 42 });
      expect(result).toEqual(expectedPermission);
    });
  });

  describe('update', () => {
    const updatePermissionDto = {
      name: 'read:reports',
    };

    it('should update a permission successfully', async () => {
      // Arrange
      const permissionId = 1;
      const updatedPermission = { ...mockPermission, ...updatePermissionDto };
      mockUpdate.mockResolvedValue({ affected: 1 });
      mockFindOneBy.mockResolvedValue(updatedPermission);

      // Act
      const result = await permissionsService.update(
        permissionId,
        updatePermissionDto,
      );

      // Assert
      expect(mockUpdate).toHaveBeenCalledWith(permissionId, updatePermissionDto);
      expect(mockFindOneBy).toHaveBeenCalledWith({ id: permissionId });
      expect(result).toEqual(updatedPermission);
      expect(result?.name).toBe(updatePermissionDto.name);
    });

    it('should throw NotFoundException when permission is not updated', async () => {
      // Arrange
      const permissionId = 999;
      mockUpdate.mockResolvedValue({ affected: 0 });

      // Act & Assert
      await expect(
        permissionsService.update(permissionId, updatePermissionDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        permissionsService.update(permissionId, updatePermissionDto),
      ).rejects.toThrow('Permission not updated');
      expect(mockUpdate).toHaveBeenCalledWith(permissionId, updatePermissionDto);
      expect(mockFindOneBy).not.toHaveBeenCalled();
    });

    it('should update only provided fields', async () => {
      // Arrange
      const permissionId = 2;
      const partialUpdate = { name: 'new:name' };
      const updatedPermission = { id: 2, name: 'new:name' };
      mockUpdate.mockResolvedValue({ affected: 1 });
      mockFindOneBy.mockResolvedValue(updatedPermission);

      // Act
      const result = await permissionsService.update(permissionId, partialUpdate);

      // Assert
      expect(mockUpdate).toHaveBeenCalledWith(permissionId, partialUpdate);
      expect(result).toEqual(updatedPermission);
    });
  });

  describe('remove', () => {
    it('should delete a permission successfully', async () => {
      // Arrange
      const permissionId = 1;
      mockDelete.mockResolvedValue({ affected: 1 });

      // Act
      const result = await permissionsService.remove(permissionId);

      // Assert
      expect(mockDelete).toHaveBeenCalledWith(permissionId);
      expect(result).toBe(permissionId);
    });

    it('should throw NotFoundException when permission deletion fails', async () => {
      // Arrange
      const permissionId = 999;
      mockDelete.mockResolvedValue({ affected: 0 });

      // Act & Assert
      await expect(permissionsService.remove(permissionId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(permissionsService.remove(permissionId)).rejects.toThrow(
        'Permission not deleted',
      );
      expect(mockDelete).toHaveBeenCalledWith(permissionId);
    });

    it('should return the deleted permission id', async () => {
      // Arrange
      const permissionId = 5;
      mockDelete.mockResolvedValue({ affected: 1 });

      // Act
      const result = await permissionsService.remove(permissionId);

      // Assert
      expect(result).toBe(5);
      expect(typeof result).toBe('number');
    });

    it('should handle deletion of non-existent permission', async () => {
      // Arrange
      const permissionId = 0;
      mockDelete.mockResolvedValue({ affected: 0 });

      // Act & Assert
      await expect(permissionsService.remove(permissionId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockDelete).toHaveBeenCalledWith(0);
    });
  });

  describe('Service Definition', () => {
    it('should be defined', () => {
      expect(permissionsService).toBeDefined();
    });

    it('should have permissionRepository injected', () => {
      expect(permissionRepository).toBeDefined();
    });

    it('should have all CRUD methods defined', () => {
      expect(typeof permissionsService.create).toBe('function');
      expect(typeof permissionsService.findAll).toBe('function');
      expect(typeof permissionsService.findOne).toBe('function');
      expect(typeof permissionsService.update).toBe('function');
      expect(typeof permissionsService.remove).toBe('function');
    });
  });
});
