import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from '../services/auth.service';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  // Mock data
  const mockUserLoginDto = {
    email: 'test@example.com',
    password: 'password123',
  };

  const mockLoginResponse = {
    access_token: 'jwt.token.here',
  };

  // Mock functions
  const mockLogin = jest.fn();

  const mockAuthService = {
    login: mockLogin,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    // Limpiar mocks antes de cada test
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should return access token when login is successful', async () => {
      // Arrange
      mockLogin.mockResolvedValue(mockLoginResponse);

      // Act
      const result = await authController.login(mockUserLoginDto);

      // Assert
      expect(mockLogin).toHaveBeenCalledWith(mockUserLoginDto);
      expect(mockLogin).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockLoginResponse);
      expect(result).toHaveProperty('access_token');
      expect(typeof result.access_token).toBe('string');
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      // Arrange
      const invalidCredentials = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };
      mockLogin.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      // Act & Assert
      await expect(authController.login(invalidCredentials)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(authController.login(invalidCredentials)).rejects.toThrow(
        'Invalid credentials',
      );
      expect(mockLogin).toHaveBeenCalledWith(invalidCredentials);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      // Arrange
      const nonExistentUser = {
        email: 'nonexistent@example.com',
        password: 'anypassword',
      };
      mockLogin.mockRejectedValue(new NotFoundException('User not found'));

      // Act & Assert
      await expect(authController.login(nonExistentUser)).rejects.toThrow(
        NotFoundException,
      );
      await expect(authController.login(nonExistentUser)).rejects.toThrow(
        'User not found',
      );
      expect(mockLogin).toHaveBeenCalledWith(nonExistentUser);
    });

    it('should pass the exact DTO to the service', async () => {
      // Arrange
      const specificLoginDto = {
        email: 'specific@example.com',
        password: 'specificPassword123',
      };
      const specificToken = {
        access_token: 'specific.jwt.token',
      };
      mockLogin.mockResolvedValue(specificToken);

      // Act
      const result = await authController.login(specificLoginDto);

      // Assert
      expect(mockLogin).toHaveBeenCalledWith(specificLoginDto);
      expect(mockLogin).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'specific@example.com',
          password: 'specificPassword123',
        }),
      );
      expect(result).toEqual(specificToken);
    });
  });

  describe('Controller Definition', () => {
    it('should be defined', () => {
      expect(authController).toBeDefined();
    });

    it('should have authService injected', () => {
      expect(authService).toBeDefined();
    });

    it('should have login method defined', () => {
      expect(typeof authController.login).toBe('function');
    });
  });
});
