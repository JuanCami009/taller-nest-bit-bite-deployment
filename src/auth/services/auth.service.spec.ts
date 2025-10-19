import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { JwtService } from '@nestjs/jwt';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Mock de bcrypt
jest.mock('bcrypt');

describe('AuthService', () => {
  let authService: AuthService;

  // Mock data
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    password: '$2b$10$hashedPassword',
    role: {
      id: 1,
      name: 'admin',
      permissions: [
        { id: 1, name: 'read:users' },
        { id: 2, name: 'write:users' },
      ],
    },
  };

  const mockFindByEmail = jest.fn();
  const mockSign = jest.fn();

  const mockUsersService = {
    findByEmail: mockFindByEmail,
  };

  const mockJwtService = {
    sign: mockSign,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);

    // Limpiar mocks antes de cada test
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'correctPassword';
      mockFindByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await authService.validateUser(email, password);

      // Assert
      expect(mockFindByEmail).toHaveBeenCalledWith(email);
      expect(mockFindByEmail).toHaveBeenCalledTimes(1);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, mockUser.password);
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      // Arrange
      const email = 'nonexistent@example.com';
      const password = 'anyPassword';
      mockFindByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.validateUser(email, password)).rejects.toThrow(
        NotFoundException,
      );
      await expect(authService.validateUser(email, password)).rejects.toThrow(
        'User not found',
      );
      expect(mockFindByEmail).toHaveBeenCalledWith(email);
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when password is incorrect', async () => {
      // Arrange
      const email = 'test@example.com';
      const wrongPassword = 'wrongPassword';
      mockFindByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(
        authService.validateUser(email, wrongPassword),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        authService.validateUser(email, wrongPassword),
      ).rejects.toThrow('Invalid credentials');
      expect(mockFindByEmail).toHaveBeenCalledWith(email);
      expect(bcrypt.compare).toHaveBeenCalledWith(wrongPassword, mockUser.password);
    });
  });

  describe('login', () => {
    const userLoginDto = {
      email: 'test@example.com',
      password: 'correctPassword',
    };

    it('should return access token when login is successful', async () => {
      // Arrange
      const expectedToken = 'jwt.token.here';
      const expectedPayload = {
        sub: mockUser.id,
        email: mockUser.email,
        permissions: ['read:users', 'write:users'],
      };

      mockFindByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockSign.mockReturnValue(expectedToken);

      // Act
      const result = await authService.login(userLoginDto);

      // Assert
      expect(result).toEqual({ access_token: expectedToken });
      expect(mockFindByEmail).toHaveBeenCalledWith(userLoginDto.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        userLoginDto.password,
        mockUser.password,
      );
      expect(mockSign).toHaveBeenCalledWith(expectedPayload);
      expect(mockSign).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when user does not exist during login', async () => {
      // Arrange
      mockFindByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.login(userLoginDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(authService.login(userLoginDto)).rejects.toThrow(
        'User not found',
      );
      expect(mockSign).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when password is incorrect during login', async () => {
      // Arrange
      mockFindByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(authService.login(userLoginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(authService.login(userLoginDto)).rejects.toThrow(
        'Invalid credentials',
      );
      expect(mockSign).not.toHaveBeenCalled();
    });

    it('should correctly map permissions from user role to JWT payload', async () => {
      // Arrange
      const userWithMultiplePermissions = {
        ...mockUser,
        role: {
          ...mockUser.role,
          permissions: [
            { id: 1, name: 'read:users' },
            { id: 2, name: 'write:users' },
            { id: 3, name: 'delete:users' },
            { id: 4, name: 'read:reports' },
          ],
        },
      };

      mockFindByEmail.mockResolvedValue(userWithMultiplePermissions);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockSign.mockReturnValue('token');

      // Act
      await authService.login(userLoginDto);

      // Assert
      expect(mockSign).toHaveBeenCalledWith({
        sub: userWithMultiplePermissions.id,
        email: userWithMultiplePermissions.email,
        permissions: ['read:users', 'write:users', 'delete:users', 'read:reports'],
      });
    });
  });

  describe('Service Definition', () => {
    it('should be defined', () => {
      expect(authService).toBeDefined();
    });
  });
});
