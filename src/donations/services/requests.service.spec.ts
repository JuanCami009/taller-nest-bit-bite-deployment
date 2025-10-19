import { Test, TestingModule } from '@nestjs/testing';
import { RequestsService } from './requests.service';
import { HealthEntitiesService } from './health-entities.service';
import { BloodsService } from './bloods.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Request } from '../entities/request.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Type, Rh } from '../entities/blood.entity';
import { InstitutionType } from '../entities/health-entity.entity';

describe('RequestsService', () => {
  let requestsService: RequestsService;
  let healthEntitiesService: HealthEntitiesService;
  let bloodsService: BloodsService;
  let requestRepository: Repository<Request>;

  // Mock data
  const mockBlood = {
    id: 1,
    type: Type.O,
    rh: Rh.POSITIVE,
    donors: [],
    bloodBags: [],
    requests: [],
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
    user: {
      id: 1,
      email: 'hospital@example.com',
    },
  };

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 7); // 7 días en el futuro

  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 7); // 7 días en el pasado

  const mockRequest = {
    id: 1,
    dateCreated: new Date(),
    quantityNeeded: 10,
    dueDate: futureDate,
    blood: mockBlood,
    healthEntity: mockHealthEntity,
    bloodBags: [],
  };

  const mockRequests = [
    mockRequest,
    {
      id: 2,
      dateCreated: new Date(),
      quantityNeeded: 5,
      dueDate: futureDate,
      blood: mockBlood,
      healthEntity: mockHealthEntity,
      bloodBags: [],
    },
  ];

  const mockCreateRequestDto = {
    quantityNeeded: 15,
    dueDate: futureDate,
    bloodId: 1,
    healthEntityId: 1,
  };

  const mockUpdateRequestDto = {
    quantityNeeded: 20,
  };

  // Mock functions
  const mockHealthEntitiesFindOne = jest.fn();
  const mockBloodsFindOne = jest.fn();
  const mockRequestCreate = jest.fn();
  const mockRequestSave = jest.fn();
  const mockRequestFind = jest.fn();
  const mockRequestFindOne = jest.fn();
  const mockRequestUpdate = jest.fn();
  const mockRequestDelete = jest.fn();

  const mockHealthEntitiesService = {
    findOne: mockHealthEntitiesFindOne,
  };

  const mockBloodsService = {
    findOne: mockBloodsFindOne,
  };

  const mockRequestRepository = {
    create: mockRequestCreate,
    save: mockRequestSave,
    find: mockRequestFind,
    findOne: mockRequestFindOne,
    update: mockRequestUpdate,
    delete: mockRequestDelete,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestsService,
        {
          provide: HealthEntitiesService,
          useValue: mockHealthEntitiesService,
        },
        {
          provide: BloodsService,
          useValue: mockBloodsService,
        },
        {
          provide: getRepositoryToken(Request),
          useValue: mockRequestRepository,
        },
      ],
    }).compile();

    requestsService = module.get<RequestsService>(RequestsService);
    healthEntitiesService = module.get<HealthEntitiesService>(
      HealthEntitiesService,
    );
    bloodsService = module.get<BloodsService>(BloodsService);
    requestRepository = module.get<Repository<Request>>(
      getRepositoryToken(Request),
    );

    // Limpiar mocks antes de cada test
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new request successfully', async () => {
      // Arrange
      const newRequest = {
        id: 3,
        ...mockCreateRequestDto,
        dateCreated: new Date(),
        healthEntity: mockHealthEntity,
        blood: mockBlood,
        bloodBags: [],
      };

      mockHealthEntitiesFindOne.mockResolvedValue(mockHealthEntity);
      mockBloodsFindOne.mockResolvedValue(mockBlood);
      mockRequestCreate.mockReturnValue(newRequest);
      mockRequestSave.mockResolvedValue(newRequest);

      // Act
      const result = await requestsService.create(mockCreateRequestDto);

      // Assert
      expect(mockHealthEntitiesFindOne).toHaveBeenCalledWith(
        mockCreateRequestDto.healthEntityId,
      );
      expect(mockBloodsFindOne).toHaveBeenCalledWith(
        mockCreateRequestDto.bloodId,
      );
      expect(mockRequestCreate).toHaveBeenCalledWith({
        ...mockCreateRequestDto,
        healthEntity: mockHealthEntity,
        blood: mockBlood,
      });
      expect(mockRequestSave).toHaveBeenCalledWith(newRequest);
      expect(result).toEqual(newRequest);
    });

    it('should throw NotFoundException when health entity does not exist', async () => {
      // Arrange
      mockHealthEntitiesFindOne.mockResolvedValue(null);
      mockBloodsFindOne.mockResolvedValue(mockBlood);

      // Act & Assert
      await expect(
        requestsService.create(mockCreateRequestDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        requestsService.create(mockCreateRequestDto),
      ).rejects.toThrow('Health entity not found');
      expect(mockHealthEntitiesFindOne).toHaveBeenCalledWith(
        mockCreateRequestDto.healthEntityId,
      );
      expect(mockRequestSave).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when blood type does not exist', async () => {
      // Arrange
      mockHealthEntitiesFindOne.mockResolvedValue(mockHealthEntity);
      mockBloodsFindOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        requestsService.create(mockCreateRequestDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        requestsService.create(mockCreateRequestDto),
      ).rejects.toThrow('Blood type not found');
      expect(mockBloodsFindOne).toHaveBeenCalledWith(
        mockCreateRequestDto.bloodId,
      );
      expect(mockRequestSave).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when quantity is zero', async () => {
      // Arrange
      const invalidDto = {
        ...mockCreateRequestDto,
        quantityNeeded: 0,
      };
      mockHealthEntitiesFindOne.mockResolvedValue(mockHealthEntity);
      mockBloodsFindOne.mockResolvedValue(mockBlood);

      // Act & Assert
      await expect(requestsService.create(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(requestsService.create(invalidDto)).rejects.toThrow(
        'Quantity must be greater than zero',
      );
      expect(mockRequestSave).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when quantity is negative', async () => {
      // Arrange
      const invalidDto = {
        ...mockCreateRequestDto,
        quantityNeeded: -5,
      };
      mockHealthEntitiesFindOne.mockResolvedValue(mockHealthEntity);
      mockBloodsFindOne.mockResolvedValue(mockBlood);

      // Act & Assert
      await expect(requestsService.create(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(requestsService.create(invalidDto)).rejects.toThrow(
        'Quantity must be greater than zero',
      );
      expect(mockRequestSave).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when due date is in the past', async () => {
      // Arrange
      const invalidDto = {
        ...mockCreateRequestDto,
        dueDate: pastDate,
      };
      mockHealthEntitiesFindOne.mockResolvedValue(mockHealthEntity);
      mockBloodsFindOne.mockResolvedValue(mockBlood);

      // Act & Assert
      await expect(requestsService.create(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(requestsService.create(invalidDto)).rejects.toThrow(
        'Due date must be a future date',
      );
      expect(mockRequestSave).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when due date is today', async () => {
      // Arrange
      const invalidDto = {
        ...mockCreateRequestDto,
        dueDate: new Date(),
      };
      mockHealthEntitiesFindOne.mockResolvedValue(mockHealthEntity);
      mockBloodsFindOne.mockResolvedValue(mockBlood);

      // Act & Assert
      await expect(requestsService.create(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(requestsService.create(invalidDto)).rejects.toThrow(
        'Due date must be a future date',
      );
      expect(mockRequestSave).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all requests', async () => {
      // Arrange
      mockRequestFind.mockResolvedValue(mockRequests);

      // Act
      const result = await requestsService.findAll();

      // Assert
      expect(mockRequestFind).toHaveBeenCalled();
      expect(result).toEqual(mockRequests);
      expect(result).toHaveLength(2);
    });

    it('should throw NotFoundException when no requests are found', async () => {
      // Arrange
      mockRequestFind.mockResolvedValue([]);

      // Act & Assert
      await expect(requestsService.findAll()).rejects.toThrow(
        NotFoundException,
      );
      await expect(requestsService.findAll()).rejects.toThrow('No users found');
      expect(mockRequestFind).toHaveBeenCalled();
    });

    it('should throw NotFoundException when requests is null', async () => {
      // Arrange
      mockRequestFind.mockResolvedValue(null);

      // Act & Assert
      await expect(requestsService.findAll()).rejects.toThrow(
        NotFoundException,
      );
      await expect(requestsService.findAll()).rejects.toThrow('No users found');
    });
  });

  describe('findOne', () => {
    it('should return a request by id', async () => {
      // Arrange
      const requestId = 1;
      mockRequestFindOne.mockResolvedValue(mockRequest);

      // Act
      const result = await requestsService.findOne(requestId);

      // Assert
      expect(mockRequestFindOne).toHaveBeenCalledWith({
        where: { id: requestId },
      });
      expect(result).toEqual(mockRequest);
    });

    it('should throw NotFoundException when request is not found', async () => {
      // Arrange
      const requestId = 999;
      mockRequestFindOne.mockResolvedValue(null);

      // Act & Assert
      await expect(requestsService.findOne(requestId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(requestsService.findOne(requestId)).rejects.toThrow(
        'Donor not found',
      );
      expect(mockRequestFindOne).toHaveBeenCalledWith({
        where: { id: requestId },
      });
    });
  });

  describe('update', () => {
    it('should update a request successfully', async () => {
      // Arrange
      const requestId = 1;
      const updatedRequest = { ...mockRequest, ...mockUpdateRequestDto };
      mockRequestUpdate.mockResolvedValue({ affected: 1 });
      mockRequestFindOne.mockResolvedValue(updatedRequest);

      // Act
      const result = await requestsService.update(
        requestId,
        mockUpdateRequestDto,
      );

      // Assert
      expect(mockRequestUpdate).toHaveBeenCalledWith(
        requestId,
        mockUpdateRequestDto,
      );
      expect(mockRequestFindOne).toHaveBeenCalledWith({
        where: { id: requestId },
      });
      expect(result).toEqual(updatedRequest);
    });

    it('should throw NotFoundException when request is not updated', async () => {
      // Arrange
      const requestId = 999;
      mockRequestUpdate.mockResolvedValue({ affected: 0 });

      // Act & Assert
      await expect(
        requestsService.update(requestId, mockUpdateRequestDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        requestsService.update(requestId, mockUpdateRequestDto),
      ).rejects.toThrow('Request not updated');
      expect(mockRequestUpdate).toHaveBeenCalledWith(
        requestId,
        mockUpdateRequestDto,
      );
      expect(mockRequestFindOne).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a request successfully', async () => {
      // Arrange
      const requestId = 1;
      mockRequestDelete.mockResolvedValue({ affected: 1 });

      // Act
      const result = await requestsService.remove(requestId);

      // Assert
      expect(mockRequestDelete).toHaveBeenCalledWith(requestId);
      expect(result).toBe(requestId);
    });

    it('should throw NotFoundException when request is not found', async () => {
      // Arrange
      const requestId = 999;
      mockRequestDelete.mockResolvedValue({ affected: 0 });

      // Act & Assert
      await expect(requestsService.remove(requestId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(requestsService.remove(requestId)).rejects.toThrow(
        'Request not deleted',
      );
      expect(mockRequestDelete).toHaveBeenCalledWith(requestId);
    });
  });

  describe('findByHealthEntityId', () => {
    it('should return all requests for a health entity', async () => {
      // Arrange
      const healthEntityId = 1;
      mockRequestFind.mockResolvedValue(mockRequests);

      // Act
      const result = await requestsService.findByHealthEntityId(healthEntityId);

      // Assert
      expect(mockRequestFind).toHaveBeenCalledWith({
        where: { healthEntity: { id: healthEntityId } },
      });
      expect(result).toEqual(mockRequests);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no requests found for health entity', async () => {
      // Arrange
      const healthEntityId = 999;
      mockRequestFind.mockResolvedValue([]);

      // Act
      const result = await requestsService.findByHealthEntityId(healthEntityId);

      // Assert
      expect(mockRequestFind).toHaveBeenCalledWith({
        where: { healthEntity: { id: healthEntityId } },
      });
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle multiple requests for same health entity', async () => {
      // Arrange
      const healthEntityId = 1;
      const multipleRequests = [...mockRequests, { ...mockRequest, id: 3 }];
      mockRequestFind.mockResolvedValue(multipleRequests);

      // Act
      const result = await requestsService.findByHealthEntityId(healthEntityId);

      // Assert
      expect(result).toHaveLength(3);
      expect(result?.every((req) => req.healthEntity.id === healthEntityId)).toBe(
        true,
      );
    });
  });

  describe('removeByHealthEntityId', () => {
    it('should delete all requests for a health entity', async () => {
      // Arrange
      const healthEntityId = 1;
      mockRequestDelete.mockResolvedValue({ affected: 2 });

      // Act
      await requestsService.removeByHealthEntityId(healthEntityId);

      // Assert
      expect(mockRequestDelete).toHaveBeenCalledWith({
        healthEntity: { id: healthEntityId },
      });
    });

    it('should handle deletion when no requests exist for health entity', async () => {
      // Arrange
      const healthEntityId = 999;
      mockRequestDelete.mockResolvedValue({ affected: 0 });

      // Act
      await requestsService.removeByHealthEntityId(healthEntityId);

      // Assert
      expect(mockRequestDelete).toHaveBeenCalledWith({
        healthEntity: { id: healthEntityId },
      });
    });

    it('should not throw error when deleting non-existent requests', async () => {
      // Arrange
      const healthEntityId = 123;
      mockRequestDelete.mockResolvedValue({ affected: 0 });

      // Act & Assert
      await expect(
        requestsService.removeByHealthEntityId(healthEntityId),
      ).resolves.not.toThrow();
      expect(mockRequestDelete).toHaveBeenCalledWith({
        healthEntity: { id: healthEntityId },
      });
    });
  });

  describe('Service Definition', () => {
    it('should be defined', () => {
      expect(requestsService).toBeDefined();
    });

    it('should have requestRepository injected', () => {
      expect(requestRepository).toBeDefined();
    });

    it('should have healthEntitiesService injected', () => {
      expect(healthEntitiesService).toBeDefined();
    });

    it('should have bloodsService injected', () => {
      expect(bloodsService).toBeDefined();
    });
  });
});
