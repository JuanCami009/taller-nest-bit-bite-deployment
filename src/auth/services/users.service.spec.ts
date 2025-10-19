import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { RolesService } from './roles.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Mock de bcrypt
jest.mock('bcrypt');

describe('UsersService', () => {
  let usersService: UsersService;
  let rolesService: RolesService;
  let userRepository: Repository<User>;

  // Mock data
  const mockRole = {
    id: 1,
    name: 'admin',
    permissions: [
      { id: 1, name: 'read:users' },
      { id: 2, name: 'write:users' },
    ],
  };

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    password: '$2b$10$hashedPassword',
    role: mockRole,
    donor: null,
    healthEntity: null,
  };

  const mockUsers = [
    mockUser,
    {
      id: 2,
      email: 'test2@example.com',
      password: '$2b$10$hashedPassword2',
      role: mockRole,
      donor: null,
      healthEntity: null,
    },
  ];

  // Mock functions
  const mockFindByName = jest.fn();
  const mockFindOne = jest.fn();
  const mockFind = jest.fn();
  const mockCreate = jest.fn();
  const mockSave = jest.fn();
  const mockUpdate = jest.fn();
  const mockDelete = jest.fn();
  const mockCreateQueryBuilder = jest.fn();

  const mockRolesService = {
    findByName: mockFindByName,
  };

  const mockUserRepository = {
    findOne: mockFindOne,
    find: mockFind,
    create: mockCreate,
    save: mockSave,
    update: mockUpdate,
    delete: mockDelete,
    createQueryBuilder: mockCreateQueryBuilder,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: RolesService,
          useValue: mockRolesService,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    rolesService = module.get<RolesService>(RolesService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));

    // Limpiar mocks antes de cada test
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createUserDto = {
      email: 'newuser@example.com',
      password: 'password123',
      roleName: 'admin',
    };

    it('should create a new user successfully', async () => {
      // Arrange
      const hashedPassword = '$2b$10$hashedPassword';
      const newUser = {
        id: 3,
        email: createUserDto.email,
        password: hashedPassword,
        role: mockRole,
      };

      mockFindByName.mockResolvedValue(mockRole);
      mockFindOne.mockResolvedValueOnce(null); // No existe usuario con ese email
      mockFindOne.mockResolvedValueOnce(newUser); // findOne después de save
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockCreate.mockReturnValue(newUser);
      mockSave.mockResolvedValue(newUser);

      // Act
      const result = await usersService.create(createUserDto);

      // Assert
      expect(mockFindByName).toHaveBeenCalledWith(createUserDto.roleName);
      expect(mockFindOne).toHaveBeenCalledWith({ where: { email: createUserDto.email } });
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockCreate).toHaveBeenCalledWith({
        email: createUserDto.email,
        password: hashedPassword,
        roleName: createUserDto.roleName,
        role: mockRole,
      });
      expect(mockSave).toHaveBeenCalledWith(newUser);
      expect(result).toEqual(newUser);
    });

    it('should throw NotFoundException when role does not exist', async () => {
      // Arrange
      mockFindByName.mockResolvedValue(null);

      // Act & Assert
      await expect(usersService.create(createUserDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockFindByName).toHaveBeenCalledWith(createUserDto.roleName);
      expect(mockFindOne).not.toHaveBeenCalled();
      expect(mockSave).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when user with email already exists', async () => {
      // Arrange
      mockFindByName.mockResolvedValue(mockRole);
      mockFindOne.mockResolvedValue(mockUser); // Usuario ya existe

      // Act & Assert
      await expect(usersService.create(createUserDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(usersService.create(createUserDto)).rejects.toThrow(
        'User with this email already exists',
      );
      expect(mockFindByName).toHaveBeenCalledWith(createUserDto.roleName);
      expect(mockFindOne).toHaveBeenCalledWith({ where: { email: createUserDto.email } });
      expect(mockSave).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      // Arrange
      mockFind.mockResolvedValue(mockUsers);

      // Act
      const result = await usersService.findAll();

      // Assert
      expect(mockFind).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
      expect(result).toHaveLength(2);
    });

    it('should throw NotFoundException when no users are found', async () => {
      // Arrange
      mockFind.mockResolvedValue([]);

      // Act & Assert
      await expect(usersService.findAll()).rejects.toThrow(NotFoundException);
      await expect(usersService.findAll()).rejects.toThrow('No users found');
      expect(mockFind).toHaveBeenCalled();
    });

    it('should throw NotFoundException when users is null', async () => {
      // Arrange
      mockFind.mockResolvedValue(null);

      // Act & Assert
      await expect(usersService.findAll()).rejects.toThrow(NotFoundException);
      await expect(usersService.findAll()).rejects.toThrow('No users found');
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      // Arrange
      const userId = 1;
      mockFindOne.mockResolvedValue(mockUser);

      // Act
      const result = await usersService.findOne(userId);

      // Assert
      expect(mockFindOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user is not found', async () => {
      // Arrange
      const userId = 999;
      mockFindOne.mockResolvedValue(null);

      // Act & Assert
      await expect(usersService.findOne(userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(usersService.findOne(userId)).rejects.toThrow(
        'User not found',
      );
      expect(mockFindOne).toHaveBeenCalledWith({ where: { id: userId } });
    });
  });

  describe('update', () => {
    const updateUserDto = {
      email: 'updated@example.com',
    };

    it('should update a user successfully', async () => {
      // Arrange
      const userId = 1;
      const updatedUser = { ...mockUser, ...updateUserDto };
      mockUpdate.mockResolvedValue({ affected: 1 });
      mockFindOne.mockResolvedValue(updatedUser);

      // Act
      const result = await usersService.update(userId, updateUserDto);

      // Assert
      expect(mockUpdate).toHaveBeenCalledWith(userId, updateUserDto);
      expect(mockFindOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(result).toEqual(updatedUser);
    });

    it('should throw NotFoundException when user is not updated', async () => {
      // Arrange
      const userId = 999;
      mockUpdate.mockResolvedValue({ affected: 0 });

      // Act & Assert
      await expect(usersService.update(userId, updateUserDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(usersService.update(userId, updateUserDto)).rejects.toThrow(
        'User not updated',
      );
      expect(mockUpdate).toHaveBeenCalledWith(userId, updateUserDto);
      expect(mockFindOne).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a user successfully when no profiles are associated', async () => {
      // Arrange
      const userId = 1;
      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          id: userId,
          donorCount: '0',
          healthEntityCount: '0',
        }),
      };

      mockCreateQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockDelete.mockResolvedValue({ affected: 1 });

      // Act
      const result = await usersService.remove(userId);

      // Assert
      expect(mockCreateQueryBuilder).toHaveBeenCalledWith('u');
      expect(mockDelete).toHaveBeenCalledWith(userId);
      expect(result).toBe(userId);
    });

    it('should throw NotFoundException when user has an associated donor profile', async () => {
      // Arrange
      const userId = 1;
      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          id: userId,
          donorCount: '1', // Tiene donante asociado
          healthEntityCount: '0',
        }),
      };

      mockCreateQueryBuilder.mockReturnValue(mockQueryBuilder);

      // Act & Assert
      await expect(usersService.remove(userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(usersService.remove(userId)).rejects.toThrow(
        'Cannot delete user: User has an associated donor profile. Delete the donor first.',
      );
      expect(mockDelete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when user has an associated health entity profile', async () => {
      // Arrange
      const userId = 1;
      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          id: userId,
          donorCount: '0',
          healthEntityCount: '1', // Tiene entidad de salud asociada
        }),
      };

      mockCreateQueryBuilder.mockReturnValue(mockQueryBuilder);

      // Act & Assert
      await expect(usersService.remove(userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(usersService.remove(userId)).rejects.toThrow(
        'Cannot delete user: User has an associated health entity profile. Delete the health entity first.',
      );
      expect(mockDelete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when user deletion fails', async () => {
      // Arrange
      const userId = 999;
      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          id: userId,
          donorCount: '0',
          healthEntityCount: '0',
        }),
      };

      mockCreateQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockDelete.mockResolvedValue({ affected: 0 });

      // Act & Assert
      await expect(usersService.remove(userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(usersService.remove(userId)).rejects.toThrow(
        'User not deleted',
      );
      expect(mockDelete).toHaveBeenCalledWith(userId);
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email with password and permissions', async () => {
      // Arrange
      const email = 'test@example.com';
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockUser),
      };

      mockCreateQueryBuilder.mockReturnValue(mockQueryBuilder);

      // Act
      const result = await usersService.findByEmail(email);

      // Assert
      expect(mockCreateQueryBuilder).toHaveBeenCalledWith('user');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('user.role', 'role');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('role.permissions', 'permissions');
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith('user.password');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('user.email = :email', { email });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user with email is not found', async () => {
      // Arrange
      const email = 'nonexistent@example.com';
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };

      mockCreateQueryBuilder.mockReturnValue(mockQueryBuilder);

      // Act & Assert
      await expect(usersService.findByEmail(email)).rejects.toThrow(
        NotFoundException,
      );
      await expect(usersService.findByEmail(email)).rejects.toThrow(
        'User not found',
      );
    });
  });

  describe('checkUserProfiles', () => {
    it('should return false for all profiles when user has no associated profiles', async () => {
      // Arrange
      const userId = 1;
      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          id: userId,
          donorCount: '0',
          healthEntityCount: '0',
        }),
      };

      mockCreateQueryBuilder.mockReturnValue(mockQueryBuilder);

      // Act
      const result = await usersService.checkUserProfiles(userId);

      // Assert
      expect(result).toEqual({
        hasDonor: false,
        hasHealthEntity: false,
        hasAnyProfile: false,
      });
      expect(mockCreateQueryBuilder).toHaveBeenCalledWith('u');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('u.id = :userId', { userId });
    });

    it('should return true for donor profile when user has an associated donor', async () => {
      // Arrange
      const userId = 1;
      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          id: userId,
          donorCount: '1',
          healthEntityCount: '0',
        }),
      };

      mockCreateQueryBuilder.mockReturnValue(mockQueryBuilder);

      // Act
      const result = await usersService.checkUserProfiles(userId);

      // Assert
      expect(result).toEqual({
        hasDonor: true,
        hasHealthEntity: false,
        hasAnyProfile: true,
      });
    });

    it('should return true for health entity profile when user has an associated health entity', async () => {
      // Arrange
      const userId = 1;
      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          id: userId,
          donorCount: '0',
          healthEntityCount: '1',
        }),
      };

      mockCreateQueryBuilder.mockReturnValue(mockQueryBuilder);

      // Act
      const result = await usersService.checkUserProfiles(userId);

      // Assert
      expect(result).toEqual({
        hasDonor: false,
        hasHealthEntity: true,
        hasAnyProfile: true,
      });
    });

    it('should return true for all when user has both profiles', async () => {
      // Arrange
      const userId = 1;
      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          id: userId,
          donorCount: '1',
          healthEntityCount: '1',
        }),
      };

      mockCreateQueryBuilder.mockReturnValue(mockQueryBuilder);

      // Act
      const result = await usersService.checkUserProfiles(userId);

      // Assert
      expect(result).toEqual({
        hasDonor: true,
        hasHealthEntity: true,
        hasAnyProfile: true,
      });
    });
  });

  describe('Service Definition', () => {
    it('should be defined', () => {
      expect(usersService).toBeDefined();
    });

    it('should have userRepository injected', () => {
      expect(userRepository).toBeDefined();
    });

    it('should have rolesService injected', () => {
      expect(rolesService).toBeDefined();
    });
  });
});
