import { Test, TestingModule } from '@nestjs/testing';
import { HealthEntitiesService } from './health-entities.service';
import { UsersService } from '../../auth/services/users.service';
import { RequestsService } from './requests.service';
import { BloodBagsService } from './blood-bags.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HealthEntity, InstitutionType } from '../entities/health-entity.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('HealthEntitiesService', () => {
  let healthEntitiesService: HealthEntitiesService;
  let usersService: UsersService;
  let requestsService: RequestsService;
  let bloodBagsService: BloodBagsService;
  let healthEntityRepository: Repository<HealthEntity>;

  // Mock data
  const mockUser = {
    id: 1,
    email: 'healthentity@example.com',
    role: {
      id: 2,
      name: 'health_entity',
      permissions: [],
    },
  };

  const mockHealthEntity = {
    id: 1,
    nit: '123456789',
    name: 'Hospital Central',
    address: '123 Main St',
    city: 'Springfield',
    phone: '555-1234',
    email: 'contact@hospitalcentral.com',
    institutionType: InstitutionType.HOSPITAL,
    user: mockUser,
  };

  const mockHealthEntities = [
    mockHealthEntity,
    {
      id: 2,
      nit: '987654321',
      name: 'Clinic North',
      address: '456 Oak Ave',
      city: 'Shelbyville',
      phone: '555-5678',
      email: 'info@clinicnorth.com',
      institutionType: InstitutionType.CLINIC,
      user: { ...mockUser, id: 2, email: 'clinic@example.com' },
    },
  ];

  const mockCreateHealthEntityDto = {
    nit: '111222333',
    name: 'Blood Bank East',
    address: '789 Pine Rd',
    city: 'Capital City',
    phone: '555-9999',
    email: 'contact@bloodbankeast.com',
    institutionType: 'hospital',
    userId: 3,
  };

  const mockUpdateHealthEntityDto = {
    name: 'Updated Hospital Name',
    phone: '555-0000',
  };

  const mockRequests = [
    { id: 1, healthEntity: mockHealthEntity },
    { id: 2, healthEntity: mockHealthEntity },
  ];

  // Mock functions
  const mockUsersFindOne = jest.fn();
  const mockUsersCheckUserProfiles = jest.fn();
  const mockUsersRemove = jest.fn();
  const mockRequestsFindByHealthEntityId = jest.fn();
  const mockRequestsRemoveByHealthEntityId = jest.fn();
  const mockBloodBagsRemoveByRequestId = jest.fn();
  const mockHealthEntityCreate = jest.fn();
  const mockHealthEntitySave = jest.fn();
  const mockHealthEntityFind = jest.fn();
  const mockHealthEntityFindOne = jest.fn();
  const mockHealthEntityUpdate = jest.fn();
  const mockHealthEntityDelete = jest.fn();

  const mockUsersService = {
    findOne: mockUsersFindOne,
    checkUserProfiles: mockUsersCheckUserProfiles,
    remove: mockUsersRemove,
  };

  const mockRequestsService = {
    findByHealthEntityId: mockRequestsFindByHealthEntityId,
    removeByHealthEntityId: mockRequestsRemoveByHealthEntityId,
  };

  const mockBloodBagsService = {
    removeByRequestId: mockBloodBagsRemoveByRequestId,
  };

  const mockHealthEntityRepository = {
    create: mockHealthEntityCreate,
    save: mockHealthEntitySave,
    find: mockHealthEntityFind,
    findOne: mockHealthEntityFindOne,
    update: mockHealthEntityUpdate,
    delete: mockHealthEntityDelete,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthEntitiesService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: RequestsService,
          useValue: mockRequestsService,
        },
        {
          provide: BloodBagsService,
          useValue: mockBloodBagsService,
        },
        {
          provide: getRepositoryToken(HealthEntity),
          useValue: mockHealthEntityRepository,
        },
      ],
    }).compile();

    healthEntitiesService = module.get<HealthEntitiesService>(
      HealthEntitiesService,
    );
    usersService = module.get<UsersService>(UsersService);
    requestsService = module.get<RequestsService>(RequestsService);
    bloodBagsService = module.get<BloodBagsService>(BloodBagsService);
    healthEntityRepository = module.get<Repository<HealthEntity>>(
      getRepositoryToken(HealthEntity),
    );

    // Limpiar mocks antes de cada test
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new health entity successfully', async () => {
      // Arrange
      const newHealthEntity = {
        id: 3,
        ...mockCreateHealthEntityDto,
        institutionType: InstitutionType.HOSPITAL,
        user: mockUser,
      };

      mockUsersFindOne.mockResolvedValue(mockUser);
      mockUsersCheckUserProfiles.mockResolvedValue({
        hasDonor: false,
        hasHealthEntity: false,
        hasAnyProfile: false,
      });
      mockHealthEntityCreate.mockReturnValue(newHealthEntity);
      mockHealthEntitySave.mockResolvedValue(newHealthEntity);

      // Act
      const result = await healthEntitiesService.create(
        mockCreateHealthEntityDto,
      );

      // Assert
      expect(mockUsersFindOne).toHaveBeenCalledWith(
        mockCreateHealthEntityDto.userId,
      );
      expect(mockUsersCheckUserProfiles).toHaveBeenCalledWith(mockUser.id);
      expect(mockHealthEntityCreate).toHaveBeenCalledWith({
        ...mockCreateHealthEntityDto,
        institutionType: InstitutionType.HOSPITAL,
        user: mockUser,
      });
      expect(mockHealthEntitySave).toHaveBeenCalledWith(newHealthEntity);
      expect(result).toEqual(newHealthEntity);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      // Arrange
      mockUsersFindOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        healthEntitiesService.create(mockCreateHealthEntityDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        healthEntitiesService.create(mockCreateHealthEntityDto),
      ).rejects.toThrow('User not found');
      expect(mockUsersFindOne).toHaveBeenCalledWith(
        mockCreateHealthEntityDto.userId,
      );
      expect(mockHealthEntitySave).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when user already has a health entity profile', async () => {
      // Arrange
      mockUsersFindOne.mockResolvedValue(mockUser);
      mockUsersCheckUserProfiles.mockResolvedValue({
        hasDonor: false,
        hasHealthEntity: true,
        hasAnyProfile: true,
      });

      // Act & Assert
      await expect(
        healthEntitiesService.create(mockCreateHealthEntityDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        healthEntitiesService.create(mockCreateHealthEntityDto),
      ).rejects.toThrow('User already has a health entity profile');
      expect(mockUsersCheckUserProfiles).toHaveBeenCalledWith(mockUser.id);
      expect(mockHealthEntitySave).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when user already has a donor profile', async () => {
      // Arrange
      mockUsersFindOne.mockResolvedValue(mockUser);
      mockUsersCheckUserProfiles.mockResolvedValue({
        hasDonor: true,
        hasHealthEntity: false,
        hasAnyProfile: false,
      });

      // Act & Assert
      await expect(
        healthEntitiesService.create(mockCreateHealthEntityDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        healthEntitiesService.create(mockCreateHealthEntityDto),
      ).rejects.toThrow('User already has a donor profile');
      expect(mockUsersCheckUserProfiles).toHaveBeenCalledWith(mockUser.id);
      expect(mockHealthEntitySave).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when institution type is invalid', async () => {
      // Arrange
      const invalidDto = {
        ...mockCreateHealthEntityDto,
        institutionType: 'invalid_type',
      };
      mockUsersFindOne.mockResolvedValue(mockUser);
      mockUsersCheckUserProfiles.mockResolvedValue({
        hasDonor: false,
        hasHealthEntity: false,
        hasAnyProfile: false,
      });

      // Act & Assert
      await expect(
        healthEntitiesService.create(invalidDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        healthEntitiesService.create(invalidDto),
      ).rejects.toThrow('Invalid institution type. Allowed values:');
      expect(mockHealthEntitySave).not.toHaveBeenCalled();
    });

    it('should convert institution type to lowercase and create successfully', async () => {
      // Arrange
      const dtoWithUpperCase = {
        ...mockCreateHealthEntityDto,
        institutionType: 'CLINIC',
      };
      const newHealthEntity = {
        id: 3,
        ...dtoWithUpperCase,
        institutionType: InstitutionType.CLINIC,
        user: mockUser,
      };

      mockUsersFindOne.mockResolvedValue(mockUser);
      mockUsersCheckUserProfiles.mockResolvedValue({
        hasDonor: false,
        hasHealthEntity: false,
        hasAnyProfile: false,
      });
      mockHealthEntityCreate.mockReturnValue(newHealthEntity);
      mockHealthEntitySave.mockResolvedValue(newHealthEntity);

      // Act
      const result = await healthEntitiesService.create(dtoWithUpperCase);

      // Assert
      expect(mockHealthEntityCreate).toHaveBeenCalledWith({
        ...dtoWithUpperCase,
        institutionType: InstitutionType.CLINIC,
        user: mockUser,
      });
      expect(result?.institutionType).toBe(InstitutionType.CLINIC);
    });
  });

  describe('findAll', () => {
    it('should return all health entities', async () => {
      // Arrange
      mockHealthEntityFind.mockResolvedValue(mockHealthEntities);

      // Act
      const result = await healthEntitiesService.findAll();

      // Assert
      expect(mockHealthEntityFind).toHaveBeenCalled();
      expect(result).toEqual(mockHealthEntities);
      expect(result).toHaveLength(2);
    });

    it('should throw NotFoundException when no health entities are found', async () => {
      // Arrange
      mockHealthEntityFind.mockResolvedValue([]);

      // Act & Assert
      await expect(healthEntitiesService.findAll()).rejects.toThrow(
        NotFoundException,
      );
      await expect(healthEntitiesService.findAll()).rejects.toThrow(
        'No health entities found',
      );
      expect(mockHealthEntityFind).toHaveBeenCalled();
    });

    it('should throw NotFoundException when health entities is null', async () => {
      // Arrange
      mockHealthEntityFind.mockResolvedValue(null);

      // Act & Assert
      await expect(healthEntitiesService.findAll()).rejects.toThrow(
        NotFoundException,
      );
      await expect(healthEntitiesService.findAll()).rejects.toThrow(
        'No health entities found',
      );
    });
  });

  describe('findOne', () => {
    it('should return a health entity by id', async () => {
      // Arrange
      const healthEntityId = 1;
      mockHealthEntityFindOne.mockResolvedValue(mockHealthEntity);

      // Act
      const result = await healthEntitiesService.findOne(healthEntityId);

      // Assert
      expect(mockHealthEntityFindOne).toHaveBeenCalledWith({
        where: { id: healthEntityId },
      });
      expect(result).toEqual(mockHealthEntity);
    });

    it('should throw NotFoundException when health entity is not found', async () => {
      // Arrange
      const healthEntityId = 999;
      mockHealthEntityFindOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        healthEntitiesService.findOne(healthEntityId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        healthEntitiesService.findOne(healthEntityId),
      ).rejects.toThrow('Health entity not found');
      expect(mockHealthEntityFindOne).toHaveBeenCalledWith({
        where: { id: healthEntityId },
      });
    });
  });

  describe('update', () => {
    it('should update a health entity successfully', async () => {
      // Arrange
      const healthEntityId = 1;
      const updatedHealthEntity = {
        ...mockHealthEntity,
        ...mockUpdateHealthEntityDto,
      };
      mockHealthEntityUpdate.mockResolvedValue({ affected: 1 });
      mockHealthEntityFindOne.mockResolvedValue(updatedHealthEntity);

      // Act
      const result = await healthEntitiesService.update(
        healthEntityId,
        mockUpdateHealthEntityDto,
      );

      // Assert
      expect(mockHealthEntityUpdate).toHaveBeenCalledWith(
        healthEntityId,
        mockUpdateHealthEntityDto,
      );
      expect(mockHealthEntityFindOne).toHaveBeenCalledWith({
        where: { id: healthEntityId },
      });
      expect(result).toEqual(updatedHealthEntity);
    });

    it('should throw NotFoundException when health entity is not updated', async () => {
      // Arrange
      const healthEntityId = 999;
      mockHealthEntityUpdate.mockResolvedValue({ affected: 0 });

      // Act & Assert
      await expect(
        healthEntitiesService.update(healthEntityId, mockUpdateHealthEntityDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        healthEntitiesService.update(healthEntityId, mockUpdateHealthEntityDto),
      ).rejects.toThrow('Health entity not updated');
      expect(mockHealthEntityUpdate).toHaveBeenCalledWith(
        healthEntityId,
        mockUpdateHealthEntityDto,
      );
      expect(mockHealthEntityFindOne).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a health entity with all associated data successfully', async () => {
      // Arrange
      const healthEntityId = 1;
      const userId = mockUser.id;
      mockHealthEntityFindOne.mockResolvedValue(mockHealthEntity);
      mockRequestsFindByHealthEntityId.mockResolvedValue(mockRequests);
      mockBloodBagsRemoveByRequestId.mockResolvedValue(undefined);
      mockRequestsRemoveByHealthEntityId.mockResolvedValue(undefined);
      mockHealthEntityDelete.mockResolvedValue({ affected: 1 });
      mockUsersRemove.mockResolvedValue(userId);

      // Act
      const result = await healthEntitiesService.remove(healthEntityId);

      // Assert
      expect(mockHealthEntityFindOne).toHaveBeenCalledWith({
        where: { id: healthEntityId },
      });
      expect(mockRequestsFindByHealthEntityId).toHaveBeenCalledWith(
        healthEntityId,
      );
      expect(mockBloodBagsRemoveByRequestId).toHaveBeenCalledTimes(2);
      expect(mockBloodBagsRemoveByRequestId).toHaveBeenNthCalledWith(1, 1);
      expect(mockBloodBagsRemoveByRequestId).toHaveBeenNthCalledWith(2, 2);
      expect(mockRequestsRemoveByHealthEntityId).toHaveBeenCalledWith(
        healthEntityId,
      );
      expect(mockHealthEntityDelete).toHaveBeenCalledWith(healthEntityId);
      expect(mockUsersRemove).toHaveBeenCalledWith(userId);
      expect(result).toBe(healthEntityId);
    });

    it('should throw NotFoundException when health entity is not found', async () => {
      // Arrange
      const healthEntityId = 999;
      mockHealthEntityFindOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        healthEntitiesService.remove(healthEntityId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        healthEntitiesService.remove(healthEntityId),
      ).rejects.toThrow('Health entity not found');
      expect(mockHealthEntityFindOne).toHaveBeenCalledWith({
        where: { id: healthEntityId },
      });
      expect(mockHealthEntityDelete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when health entity deletion fails', async () => {
      // Arrange
      const healthEntityId = 1;
      mockHealthEntityFindOne.mockResolvedValue(mockHealthEntity);
      mockRequestsFindByHealthEntityId.mockResolvedValue(mockRequests);
      mockBloodBagsRemoveByRequestId.mockResolvedValue(undefined);
      mockRequestsRemoveByHealthEntityId.mockResolvedValue(undefined);
      mockHealthEntityDelete.mockResolvedValue({ affected: 0 });

      // Act & Assert
      await expect(
        healthEntitiesService.remove(healthEntityId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        healthEntitiesService.remove(healthEntityId),
      ).rejects.toThrow('Health entity not deleted');
      expect(mockHealthEntityDelete).toHaveBeenCalledWith(healthEntityId);
      expect(mockUsersRemove).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when user deletion fails', async () => {
      // Arrange
      const healthEntityId = 1;
      const userId = mockUser.id;
      mockHealthEntityFindOne.mockResolvedValue(mockHealthEntity);
      mockRequestsFindByHealthEntityId.mockResolvedValue(mockRequests);
      mockBloodBagsRemoveByRequestId.mockResolvedValue(undefined);
      mockRequestsRemoveByHealthEntityId.mockResolvedValue(undefined);
      mockHealthEntityDelete.mockResolvedValue({ affected: 1 });
      mockUsersRemove.mockResolvedValue(null);

      // Act & Assert
      await expect(
        healthEntitiesService.remove(healthEntityId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        healthEntitiesService.remove(healthEntityId),
      ).rejects.toThrow('User not found');
      expect(mockHealthEntityDelete).toHaveBeenCalledWith(healthEntityId);
      expect(mockUsersRemove).toHaveBeenCalledWith(userId);
    });

    it('should handle removal when there are no requests associated', async () => {
      // Arrange
      const healthEntityId = 1;
      const userId = mockUser.id;
      mockHealthEntityFindOne.mockResolvedValue(mockHealthEntity);
      mockRequestsFindByHealthEntityId.mockResolvedValue([]);
      mockHealthEntityDelete.mockResolvedValue({ affected: 1 });
      mockUsersRemove.mockResolvedValue(userId);

      // Act
      const result = await healthEntitiesService.remove(healthEntityId);

      // Assert
      expect(mockRequestsFindByHealthEntityId).toHaveBeenCalledWith(
        healthEntityId,
      );
      expect(mockBloodBagsRemoveByRequestId).not.toHaveBeenCalled();
      expect(mockRequestsRemoveByHealthEntityId).toHaveBeenCalledWith(
        healthEntityId,
      );
      expect(mockHealthEntityDelete).toHaveBeenCalledWith(healthEntityId);
      expect(result).toBe(healthEntityId);
    });
  });

  describe('Service Definition', () => {
    it('should be defined', () => {
      expect(healthEntitiesService).toBeDefined();
    });

    it('should have healthEntityRepository injected', () => {
      expect(healthEntityRepository).toBeDefined();
    });

    it('should have usersService injected', () => {
      expect(usersService).toBeDefined();
    });

    it('should have requestsService injected', () => {
      expect(requestsService).toBeDefined();
    });

    it('should have bloodBagsService injected', () => {
      expect(bloodBagsService).toBeDefined();
    });
  });
});
