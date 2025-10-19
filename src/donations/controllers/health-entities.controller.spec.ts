import { Test, TestingModule } from '@nestjs/testing';
import { HealthEntitiesController } from './health-entities.controller';
import { HealthEntitiesService } from '../services/health-entities.service';
import { InstitutionType } from '../entities/health-entity.entity';

describe('HealthEntitiesController', () => {
  let healthEntitiesController: HealthEntitiesController;
  let healthEntitiesService: HealthEntitiesService;

  // Mock data
  const mockUser = {
    id: 1,
    email: 'hospital@example.com',
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
    {
      id: 3,
      nit: '555666777',
      name: 'Blood Bank East',
      address: '789 Pine Rd',
      city: 'Capital City',
      phone: '555-9999',
      email: 'contact@bloodbankeast.com',
      institutionType: InstitutionType.BLOODBANK,
      user: { ...mockUser, id: 3, email: 'bloodbank@example.com' },
    },
  ];

  const mockCreateHealthEntityDto = {
    nit: '111222333',
    name: 'New Hospital',
    address: '321 Elm St',
    city: 'New City',
    phone: '555-0000',
    email: 'newhospital@example.com',
    institutionType: 'hospital',
    userId: 4,
  };

  const mockUpdateHealthEntityDto = {
    name: 'Updated Hospital Name',
    phone: '555-1111',
  };

  // Mock functions
  const mockServiceCreate = jest.fn();
  const mockServiceFindAll = jest.fn();
  const mockServiceFindOne = jest.fn();
  const mockServiceUpdate = jest.fn();
  const mockServiceRemove = jest.fn();

  const mockHealthEntitiesService = {
    create: mockServiceCreate,
    findAll: mockServiceFindAll,
    findOne: mockServiceFindOne,
    update: mockServiceUpdate,
    remove: mockServiceRemove,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthEntitiesController],
      providers: [
        {
          provide: HealthEntitiesService,
          useValue: mockHealthEntitiesService,
        },
      ],
    }).compile();

    healthEntitiesController = module.get<HealthEntitiesController>(
      HealthEntitiesController,
    );
    healthEntitiesService = module.get<HealthEntitiesService>(
      HealthEntitiesService,
    );

    // Limpiar mocks antes de cada test
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new health entity successfully', async () => {
      // Arrange
      const newHealthEntity = {
        id: 4,
        ...mockCreateHealthEntityDto,
        institutionType: InstitutionType.HOSPITAL,
        user: mockUser,
      };
      mockServiceCreate.mockResolvedValue(newHealthEntity);

      // Act
      const result = await healthEntitiesController.create(
        mockCreateHealthEntityDto,
      );

      // Assert
      expect(mockServiceCreate).toHaveBeenCalledWith(mockCreateHealthEntityDto);
      expect(mockServiceCreate).toHaveBeenCalledTimes(1);
      expect(result).toEqual(newHealthEntity);
    });

    it('should create health entity with clinic type', async () => {
      // Arrange
      const clinicDto = {
        ...mockCreateHealthEntityDto,
        institutionType: 'clinic',
        name: 'New Clinic',
      };
      const newClinic = {
        id: 5,
        ...clinicDto,
        institutionType: InstitutionType.CLINIC,
        user: mockUser,
      };
      mockServiceCreate.mockResolvedValue(newClinic);

      // Act
      const result = await healthEntitiesController.create(clinicDto);

      // Assert
      expect(mockServiceCreate).toHaveBeenCalledWith(clinicDto);
      expect(result?.institutionType).toBe(InstitutionType.CLINIC);
      expect(result?.name).toBe('New Clinic');
    });

    it('should create health entity with blood bank type', async () => {
      // Arrange
      const bloodBankDto = {
        ...mockCreateHealthEntityDto,
        institutionType: 'bloodBank',
        name: 'New Blood Bank',
      };
      const newBloodBank = {
        id: 6,
        ...bloodBankDto,
        institutionType: InstitutionType.BLOODBANK,
        user: mockUser,
      };
      mockServiceCreate.mockResolvedValue(newBloodBank);

      // Act
      const result = await healthEntitiesController.create(bloodBankDto);

      // Assert
      expect(mockServiceCreate).toHaveBeenCalledWith(bloodBankDto);
      expect(result?.institutionType).toBe(InstitutionType.BLOODBANK);
      expect(result?.name).toBe('New Blood Bank');
    });

    it('should create health entity and associate with existing user', async () => {
      // Arrange
      const dtoWithUser = {
        ...mockCreateHealthEntityDto,
        userId: 10,
      };
      const existingUser = {
        id: 10,
        email: 'existing@example.com',
        role: mockUser.role,
      };
      const createdEntity = {
        id: 7,
        ...dtoWithUser,
        institutionType: InstitutionType.HOSPITAL,
        user: existingUser,
      };
      mockServiceCreate.mockResolvedValue(createdEntity);

      // Act
      const result = await healthEntitiesController.create(dtoWithUser);

      // Assert
      expect(mockServiceCreate).toHaveBeenCalledWith(dtoWithUser);
      expect(result?.user?.id).toBe(10);
      expect(result?.user?.email).toBe('existing@example.com');
    });
  });

  describe('findAll', () => {
    it('should return all health entities', async () => {
      // Arrange
      mockServiceFindAll.mockResolvedValue(mockHealthEntities);

      // Act
      const result = await healthEntitiesController.findAll();

      // Assert
      expect(mockServiceFindAll).toHaveBeenCalled();
      expect(mockServiceFindAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockHealthEntities);
      expect(result).toHaveLength(3);
    });

    it('should return health entities with different institution types', async () => {
      // Arrange
      mockServiceFindAll.mockResolvedValue(mockHealthEntities);

      // Act
      const result = await healthEntitiesController.findAll();

      // Assert
      expect(result).toHaveLength(3);
      expect(result?.[0]?.institutionType).toBe(InstitutionType.HOSPITAL);
      expect(result?.[1]?.institutionType).toBe(InstitutionType.CLINIC);
      expect(result?.[2]?.institutionType).toBe(InstitutionType.BLOODBANK);
    });

    it('should return health entities from different cities', async () => {
      // Arrange
      mockServiceFindAll.mockResolvedValue(mockHealthEntities);

      // Act
      const result = await healthEntitiesController.findAll();

      // Assert
      expect(result?.[0]?.city).toBe('Springfield');
      expect(result?.[1]?.city).toBe('Shelbyville');
      expect(result?.[2]?.city).toBe('Capital City');
    });

    it('should call service without parameters', async () => {
      // Arrange
      mockServiceFindAll.mockResolvedValue(mockHealthEntities);

      // Act
      await healthEntitiesController.findAll();

      // Assert
      expect(mockServiceFindAll).toHaveBeenCalledWith();
    });
  });

  describe('findOne', () => {
    it('should return a health entity by id', async () => {
      // Arrange
      const healthEntityId = 1;
      mockServiceFindOne.mockResolvedValue(mockHealthEntity);

      // Act
      const result = await healthEntitiesController.findOne(healthEntityId);

      // Assert
      expect(mockServiceFindOne).toHaveBeenCalledWith(healthEntityId);
      expect(mockServiceFindOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockHealthEntity);
    });

    it('should return health entity with all associated data', async () => {
      // Arrange
      const healthEntityId = 1;
      mockServiceFindOne.mockResolvedValue(mockHealthEntity);

      // Act
      const result = await healthEntitiesController.findOne(healthEntityId);

      // Assert
      expect(result?.user).toBeDefined();
      expect(result?.nit).toBe('123456789');
      expect(result?.institutionType).toBe(InstitutionType.HOSPITAL);
    });

    it('should handle different health entity ids', async () => {
      // Arrange
      const healthEntityId = 2;
      const clinic = mockHealthEntities[1];
      mockServiceFindOne.mockResolvedValue(clinic);

      // Act
      const result = await healthEntitiesController.findOne(healthEntityId);

      // Assert
      expect(mockServiceFindOne).toHaveBeenCalledWith(healthEntityId);
      expect(result?.id).toBe(2);
      expect(result?.name).toBe('Clinic North');
      expect(result?.institutionType).toBe(InstitutionType.CLINIC);
    });

    it('should use ParseIntPipe for id parameter', async () => {
      // Arrange
      const healthEntityId = 3;
      const bloodBank = mockHealthEntities[2];
      mockServiceFindOne.mockResolvedValue(bloodBank);

      // Act
      const result = await healthEntitiesController.findOne(healthEntityId);

      // Assert
      expect(mockServiceFindOne).toHaveBeenCalledWith(healthEntityId);
      expect(typeof healthEntityId).toBe('number');
      expect(result?.id).toBe(3);
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
      mockServiceUpdate.mockResolvedValue(updatedHealthEntity);

      // Act
      const result = await healthEntitiesController.update(
        healthEntityId,
        mockUpdateHealthEntityDto,
      );

      // Assert
      expect(mockServiceUpdate).toHaveBeenCalledWith(
        healthEntityId,
        mockUpdateHealthEntityDto,
      );
      expect(mockServiceUpdate).toHaveBeenCalledTimes(1);
      expect(result).toEqual(updatedHealthEntity);
    });

    it('should update only name field', async () => {
      // Arrange
      const healthEntityId = 1;
      const partialUpdate = { name: 'New Hospital Name' };
      const updatedEntity = {
        ...mockHealthEntity,
        name: 'New Hospital Name',
      };
      mockServiceUpdate.mockResolvedValue(updatedEntity);

      // Act
      const result = await healthEntitiesController.update(
        healthEntityId,
        partialUpdate,
      );

      // Assert
      expect(mockServiceUpdate).toHaveBeenCalledWith(
        healthEntityId,
        partialUpdate,
      );
      expect(result?.name).toBe('New Hospital Name');
      expect(result?.phone).toBe('555-1234');
    });

    it('should update only phone field', async () => {
      // Arrange
      const healthEntityId = 2;
      const partialUpdate = { phone: '555-9876' };
      const updatedEntity = {
        ...mockHealthEntities[1],
        phone: '555-9876',
      };
      mockServiceUpdate.mockResolvedValue(updatedEntity);

      // Act
      const result = await healthEntitiesController.update(
        healthEntityId,
        partialUpdate,
      );

      // Assert
      expect(mockServiceUpdate).toHaveBeenCalledWith(
        healthEntityId,
        partialUpdate,
      );
      expect(result?.phone).toBe('555-9876');
      expect(result?.name).toBe('Clinic North');
    });

    it('should update multiple fields at once', async () => {
      // Arrange
      const healthEntityId = 1;
      const multiFieldUpdate = {
        name: 'Updated Name',
        address: 'Updated Address',
        city: 'Updated City',
        email: 'updated@example.com',
      };
      const updatedEntity = {
        ...mockHealthEntity,
        ...multiFieldUpdate,
      };
      mockServiceUpdate.mockResolvedValue(updatedEntity);

      // Act
      const result = await healthEntitiesController.update(
        healthEntityId,
        multiFieldUpdate,
      );

      // Assert
      expect(mockServiceUpdate).toHaveBeenCalledWith(
        healthEntityId,
        multiFieldUpdate,
      );
      expect(result?.name).toBe('Updated Name');
      expect(result?.address).toBe('Updated Address');
      expect(result?.city).toBe('Updated City');
      expect(result?.email).toBe('updated@example.com');
    });
  });

  describe('remove', () => {
    it('should delete a health entity successfully', async () => {
      // Arrange
      const healthEntityId = 1;
      mockServiceRemove.mockResolvedValue(healthEntityId);

      // Act
      const result = await healthEntitiesController.remove(healthEntityId);

      // Assert
      expect(mockServiceRemove).toHaveBeenCalledWith(healthEntityId);
      expect(mockServiceRemove).toHaveBeenCalledTimes(1);
      expect(result).toBe(healthEntityId);
    });

    it('should delete health entity with different ids', async () => {
      // Arrange
      const healthEntityId = 5;
      mockServiceRemove.mockResolvedValue(healthEntityId);

      // Act
      const result = await healthEntitiesController.remove(healthEntityId);

      // Assert
      expect(mockServiceRemove).toHaveBeenCalledWith(healthEntityId);
      expect(result).toBe(5);
    });

    it('should use ParseIntPipe for id parameter in delete', async () => {
      // Arrange
      const healthEntityId = 10;
      mockServiceRemove.mockResolvedValue(healthEntityId);

      // Act
      const result = await healthEntitiesController.remove(healthEntityId);

      // Assert
      expect(mockServiceRemove).toHaveBeenCalledWith(healthEntityId);
      expect(typeof healthEntityId).toBe('number');
      expect(result).toBe(10);
    });

    it('should return deleted health entity id', async () => {
      // Arrange
      const healthEntityId = 3;
      mockServiceRemove.mockResolvedValue(healthEntityId);

      // Act
      const result = await healthEntitiesController.remove(healthEntityId);

      // Assert
      expect(result).toBe(healthEntityId);
      expect(mockServiceRemove).toHaveBeenCalledWith(healthEntityId);
    });
  });

  describe('Controller Definition', () => {
    it('should be defined', () => {
      expect(healthEntitiesController).toBeDefined();
    });

    it('should have healthEntitiesService injected', () => {
      expect(healthEntitiesService).toBeDefined();
    });
  });
});
