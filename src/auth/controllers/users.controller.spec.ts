import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Mock de los guards antes de importar el controlador
jest.mock('../../common/guards/permission.guard', () => ({
  PermissionsGuard: jest.fn().mockImplementation(() => ({
    canActivate: () => true,
  })),
}));

jest.mock('../../common/decorators/permission.decorator', () => ({
  Permissions: () => jest.fn(),
}));

import { UsersController } from './users.controller';
import { UsersService } from '../services/users.service';
import { PermissionsGuard } from '../../common/guards/permission.guard';

describe('UsersController', () => {
  let usersController: UsersController;
  let usersService: UsersService;

  // Mock data
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    password: '$2b$10$hashedPassword',
    role: {
      id: 1,
      name: 'admin',
      permissions: [{ id: 1, name: 'read:users' }],
    },
  };

  const mockUsers = [
    mockUser,
    {
      id: 2,
      email: 'test2@example.com',
      password: '$2b$10$hashedPassword2',
      role: {
        id: 2,
        name: 'user',
        permissions: [{ id: 1, name: 'read:users' }],
      },
    },
  ];

  const mockCreateUserDto = {
    email: 'newuser@example.com',
    password: 'password123',
    roleName: 'user',
  };

  const mockUpdateUserDto = {
    email: 'updated@example.com',
  };

  // Mock functions
  const mockCreate = jest.fn();
  const mockFindAll = jest.fn();
  const mockFindOne = jest.fn();
  const mockUpdate = jest.fn();
  const mockRemove = jest.fn();

  const mockUsersService = {
    create: mockCreate,
    findAll: mockFindAll,
    findOne: mockFindOne,
    update: mockUpdate,
    remove: mockRemove,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    usersController = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);

    // Limpiar mocks antes de cada test
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      // Arrange
      const newUser = {
        id: 3,
        email: mockCreateUserDto.email,
        password: '$2b$10$newHashedPassword',
        role: mockUser.role,
      };
      mockCreate.mockResolvedValue(newUser);

      // Act
      const result = await usersController.create(mockCreateUserDto);

      // Assert
      expect(mockCreate).toHaveBeenCalledWith(mockCreateUserDto);
      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(result).toEqual(newUser);
      expect(result).toBeDefined();
      expect(result?.email).toBe(mockCreateUserDto.email);
    });

    it('should throw NotFoundException when role does not exist', async () => {
      // Arrange
      mockCreate.mockRejectedValue(new NotFoundException('Role not found'));

      // Act & Assert
      await expect(usersController.create(mockCreateUserDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(usersController.create(mockCreateUserDto)).rejects.toThrow(
        'Role not found',
      );
      expect(mockCreate).toHaveBeenCalledWith(mockCreateUserDto);
    });

    it('should throw NotFoundException when email already exists', async () => {
      // Arrange
      mockCreate.mockRejectedValue(
        new NotFoundException('User with this email already exists'),
      );

      // Act & Assert
      await expect(usersController.create(mockCreateUserDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(usersController.create(mockCreateUserDto)).rejects.toThrow(
        'User with this email already exists',
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      // Arrange
      mockFindAll.mockResolvedValue(mockUsers);

      // Act
      const result = await usersController.findAll();

      // Assert
      expect(mockFindAll).toHaveBeenCalled();
      expect(mockFindAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUsers);
      expect(result).toHaveLength(2);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should throw NotFoundException when no users are found', async () => {
      // Arrange
      mockFindAll.mockRejectedValue(
        new NotFoundException('No users found'),
      );

      // Act & Assert
      await expect(usersController.findAll()).rejects.toThrow(
        NotFoundException,
      );
      await expect(usersController.findAll()).rejects.toThrow(
        'No users found',
      );
      expect(mockFindAll).toHaveBeenCalled();
    });

    it('should return all users with their roles and permissions', async () => {
      // Arrange
      mockFindAll.mockResolvedValue(mockUsers);

      // Act
      const result = await usersController.findAll();

      // Assert
      expect(result).toBeDefined();
      expect(result?.[0]).toHaveProperty('role');
      expect(result?.[0].role).toHaveProperty('permissions');
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      // Arrange
      const userId = 1;
      mockFindOne.mockResolvedValue(mockUser);

      // Act
      const result = await usersController.findOne(userId);

      // Assert
      expect(mockFindOne).toHaveBeenCalledWith(userId);
      expect(mockFindOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUser);
      expect(result).toBeDefined();
      expect(result?.id).toBe(userId);
    });

    it('should throw NotFoundException when user is not found', async () => {
      // Arrange
      const userId = 999;
      mockFindOne.mockRejectedValue(new NotFoundException('User not found'));

      // Act & Assert
      await expect(usersController.findOne(userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(usersController.findOne(userId)).rejects.toThrow(
        'User not found',
      );
      expect(mockFindOne).toHaveBeenCalledWith(userId);
    });

    it('should accept numeric id parameter', async () => {
      // Arrange
      const userId = 42;
      const expectedUser = { ...mockUser, id: userId };
      mockFindOne.mockResolvedValue(expectedUser);

      // Act
      const result = await usersController.findOne(userId);

      // Assert
      expect(mockFindOne).toHaveBeenCalledWith(42);
      expect(typeof userId).toBe('number');
      expect(result).toBeDefined();
      expect(result?.id).toBe(userId);
    });
  });

  describe('update', () => {
    it('should update a user successfully', async () => {
      // Arrange
      const userId = 1;
      const updatedUser = { ...mockUser, ...mockUpdateUserDto };
      mockUpdate.mockResolvedValue(updatedUser);

      // Act
      const result = await usersController.update(userId, mockUpdateUserDto);

      // Assert
      expect(mockUpdate).toHaveBeenCalledWith(userId, mockUpdateUserDto);
      expect(mockUpdate).toHaveBeenCalledTimes(1);
      expect(result).toEqual(updatedUser);
      expect(result).toBeDefined();
      expect(result?.email).toBe(mockUpdateUserDto.email);
    });

    it('should throw NotFoundException when user to update is not found', async () => {
      // Arrange
      const userId = 999;
      mockUpdate.mockRejectedValue(
        new NotFoundException('User not updated'),
      );

      // Act & Assert
      await expect(
        usersController.update(userId, mockUpdateUserDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        usersController.update(userId, mockUpdateUserDto),
      ).rejects.toThrow('User not updated');
      expect(mockUpdate).toHaveBeenCalledWith(userId, mockUpdateUserDto);
    });

    it('should pass both id and updateDto to the service', async () => {
      // Arrange
      const userId = 5;
      const updateDto = { email: 'newemail@example.com' };
      const updatedUser = { ...mockUser, id: userId, ...updateDto };
      mockUpdate.mockResolvedValue(updatedUser);

      // Act
      await usersController.update(userId, updateDto);

      // Assert
      expect(mockUpdate).toHaveBeenCalledWith(userId, updateDto);
      expect(mockUpdate).toHaveBeenCalledWith(
        5,
        expect.objectContaining({ email: 'newemail@example.com' }),
      );
    });
  });

  describe('remove', () => {
    it('should delete a user successfully', async () => {
      // Arrange
      const userId = 1;
      mockRemove.mockResolvedValue(userId);

      // Act
      const result = await usersController.remove(userId);

      // Assert
      expect(mockRemove).toHaveBeenCalledWith(userId);
      expect(mockRemove).toHaveBeenCalledTimes(1);
      expect(result).toBe(userId);
    });

    it('should throw NotFoundException when user has associated donor profile', async () => {
      // Arrange
      const userId = 1;
      mockRemove.mockRejectedValue(
        new NotFoundException(
          'Cannot delete user: User has an associated donor profile. Delete the donor first.',
        ),
      );

      // Act & Assert
      await expect(usersController.remove(userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(usersController.remove(userId)).rejects.toThrow(
        'Cannot delete user: User has an associated donor profile. Delete the donor first.',
      );
      expect(mockRemove).toHaveBeenCalledWith(userId);
    });

    it('should throw NotFoundException when user has associated health entity profile', async () => {
      // Arrange
      const userId = 2;
      mockRemove.mockRejectedValue(
        new NotFoundException(
          'Cannot delete user: User has an associated health entity profile. Delete the health entity first.',
        ),
      );

      // Act & Assert
      await expect(usersController.remove(userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(usersController.remove(userId)).rejects.toThrow(
        'Cannot delete user: User has an associated health entity profile. Delete the health entity first.',
      );
    });

    it('should throw NotFoundException when user deletion fails', async () => {
      // Arrange
      const userId = 999;
      mockRemove.mockRejectedValue(
        new NotFoundException('User not deleted'),
      );

      // Act & Assert
      await expect(usersController.remove(userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(usersController.remove(userId)).rejects.toThrow(
        'User not deleted',
      );
      expect(mockRemove).toHaveBeenCalledWith(userId);
    });
  });

  describe('Controller Definition', () => {
    it('should be defined', () => {
      expect(usersController).toBeDefined();
    });

    it('should have usersService injected', () => {
      expect(usersService).toBeDefined();
    });

    it('should have all CRUD methods defined', () => {
      expect(typeof usersController.create).toBe('function');
      expect(typeof usersController.findAll).toBe('function');
      expect(typeof usersController.findOne).toBe('function');
      expect(typeof usersController.update).toBe('function');
      expect(typeof usersController.remove).toBe('function');
    });
  });
});
