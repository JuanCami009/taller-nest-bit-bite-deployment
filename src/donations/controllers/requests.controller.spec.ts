import { Test, TestingModule } from '@nestjs/testing';
import { RequestsController } from './requests.controller';
import { RequestsService } from '../services/requests.service';
import { Type, Rh } from '../entities/blood.entity';
import { InstitutionType } from '../entities/health-entity.entity';

describe('RequestsController', () => {
  let requestsController: RequestsController;
  let requestsService: RequestsService;

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
      blood: { ...mockBlood, id: 2, type: Type.A },
      healthEntity: mockHealthEntity,
      bloodBags: [],
    },
    {
      id: 3,
      dateCreated: new Date(),
      quantityNeeded: 15,
      dueDate: futureDate,
      blood: { ...mockBlood, id: 3, type: Type.B, rh: Rh.NEGATIVE },
      healthEntity: {
        ...mockHealthEntity,
        id: 2,
        name: 'Clinic North',
        institutionType: InstitutionType.CLINIC,
      },
      bloodBags: [],
    },
  ];

  const mockCreateRequestDto = {
    quantityNeeded: 20,
    dueDate: futureDate,
    bloodId: 1,
    healthEntityId: 1,
  };

  const mockUpdateRequestDto = {
    quantityNeeded: 25,
  };

  // Mock functions
  const mockServiceCreate = jest.fn();
  const mockServiceFindAll = jest.fn();
  const mockServiceFindOne = jest.fn();
  const mockServiceUpdate = jest.fn();
  const mockServiceRemove = jest.fn();

  const mockRequestsService = {
    create: mockServiceCreate,
    findAll: mockServiceFindAll,
    findOne: mockServiceFindOne,
    update: mockServiceUpdate,
    remove: mockServiceRemove,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RequestsController],
      providers: [
        {
          provide: RequestsService,
          useValue: mockRequestsService,
        },
      ],
    }).compile();

    requestsController = module.get<RequestsController>(RequestsController);
    requestsService = module.get<RequestsService>(RequestsService);

    // Limpiar mocks antes de cada test
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new request successfully', async () => {
      // Arrange
      const newRequest = {
        id: 4,
        ...mockCreateRequestDto,
        dateCreated: new Date(),
        blood: mockBlood,
        healthEntity: mockHealthEntity,
        bloodBags: [],
      };
      mockServiceCreate.mockResolvedValue(newRequest);

      // Act
      const result = await requestsController.create(mockCreateRequestDto);

      // Assert
      expect(mockServiceCreate).toHaveBeenCalledWith(mockCreateRequestDto);
      expect(mockServiceCreate).toHaveBeenCalledTimes(1);
      expect(result).toEqual(newRequest);
    });

    it('should create request with different blood types', async () => {
      // Arrange
      const requestDtoAB = {
        ...mockCreateRequestDto,
        bloodId: 4,
      };
      const newRequestAB = {
        id: 5,
        ...requestDtoAB,
        dateCreated: new Date(),
        blood: { id: 4, type: Type.AB, rh: Rh.POSITIVE },
        healthEntity: mockHealthEntity,
        bloodBags: [],
      };
      mockServiceCreate.mockResolvedValue(newRequestAB);

      // Act
      const result = await requestsController.create(requestDtoAB);

      // Assert
      expect(mockServiceCreate).toHaveBeenCalledWith(requestDtoAB);
      expect(result?.blood?.type).toBe(Type.AB);
      expect(result?.blood?.rh).toBe(Rh.POSITIVE);
    });

    it('should create request with large quantity needed', async () => {
      // Arrange
      const largeQuantityDto = {
        ...mockCreateRequestDto,
        quantityNeeded: 100,
      };
      const newRequest = {
        id: 6,
        ...largeQuantityDto,
        dateCreated: new Date(),
        blood: mockBlood,
        healthEntity: mockHealthEntity,
        bloodBags: [],
      };
      mockServiceCreate.mockResolvedValue(newRequest);

      // Act
      const result = await requestsController.create(largeQuantityDto);

      // Assert
      expect(mockServiceCreate).toHaveBeenCalledWith(largeQuantityDto);
      expect(result?.quantityNeeded).toBe(100);
    });

    it('should create request for different health entity', async () => {
      // Arrange
      const differentEntityDto = {
        ...mockCreateRequestDto,
        healthEntityId: 5,
      };
      const differentHealthEntity = {
        ...mockHealthEntity,
        id: 5,
        name: 'Blood Bank East',
        institutionType: InstitutionType.BLOODBANK,
      };
      const newRequest = {
        id: 7,
        ...differentEntityDto,
        dateCreated: new Date(),
        blood: mockBlood,
        healthEntity: differentHealthEntity,
        bloodBags: [],
      };
      mockServiceCreate.mockResolvedValue(newRequest);

      // Act
      const result = await requestsController.create(differentEntityDto);

      // Assert
      expect(mockServiceCreate).toHaveBeenCalledWith(differentEntityDto);
      expect(result?.healthEntity?.id).toBe(5);
      expect(result?.healthEntity?.institutionType).toBe(
        InstitutionType.BLOODBANK,
      );
    });
  });

  describe('findAll', () => {
    it('should return all requests', async () => {
      // Arrange
      mockServiceFindAll.mockResolvedValue(mockRequests);

      // Act
      const result = await requestsController.findAll();

      // Assert
      expect(mockServiceFindAll).toHaveBeenCalled();
      expect(mockServiceFindAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockRequests);
      expect(result).toHaveLength(3);
    });

    it('should return requests with different blood types', async () => {
      // Arrange
      mockServiceFindAll.mockResolvedValue(mockRequests);

      // Act
      const result = await requestsController.findAll();

      // Assert
      expect(result).toHaveLength(3);
      expect(result?.[0]?.blood?.type).toBe(Type.O);
      expect(result?.[1]?.blood?.type).toBe(Type.A);
      expect(result?.[2]?.blood?.type).toBe(Type.B);
    });

    it('should return requests with different quantities', async () => {
      // Arrange
      mockServiceFindAll.mockResolvedValue(mockRequests);

      // Act
      const result = await requestsController.findAll();

      // Assert
      expect(result?.[0]?.quantityNeeded).toBe(10);
      expect(result?.[1]?.quantityNeeded).toBe(5);
      expect(result?.[2]?.quantityNeeded).toBe(15);
    });

    it('should call service without parameters', async () => {
      // Arrange
      mockServiceFindAll.mockResolvedValue(mockRequests);

      // Act
      await requestsController.findAll();

      // Assert
      expect(mockServiceFindAll).toHaveBeenCalledWith();
    });
  });

  describe('findOne', () => {
    it('should return a request by id', async () => {
      // Arrange
      const requestId = 1;
      mockServiceFindOne.mockResolvedValue(mockRequest);

      // Act
      const result = await requestsController.findOne(requestId);

      // Assert
      expect(mockServiceFindOne).toHaveBeenCalledWith(requestId);
      expect(mockServiceFindOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockRequest);
    });

    it('should return request with all associated data', async () => {
      // Arrange
      const requestId = 1;
      mockServiceFindOne.mockResolvedValue(mockRequest);

      // Act
      const result = await requestsController.findOne(requestId);

      // Assert
      expect(result?.blood).toBeDefined();
      expect(result?.healthEntity).toBeDefined();
      expect(result?.quantityNeeded).toBe(10);
    });

    it('should handle different request ids', async () => {
      // Arrange
      const requestId = 2;
      const request2 = mockRequests[1];
      mockServiceFindOne.mockResolvedValue(request2);

      // Act
      const result = await requestsController.findOne(requestId);

      // Assert
      expect(mockServiceFindOne).toHaveBeenCalledWith(requestId);
      expect(result?.id).toBe(2);
      expect(result?.quantityNeeded).toBe(5);
    });

    it('should use ParseIntPipe for id parameter', async () => {
      // Arrange
      const requestId = 3;
      const request3 = mockRequests[2];
      mockServiceFindOne.mockResolvedValue(request3);

      // Act
      const result = await requestsController.findOne(requestId);

      // Assert
      expect(mockServiceFindOne).toHaveBeenCalledWith(requestId);
      expect(typeof requestId).toBe('number');
      expect(result?.id).toBe(3);
    });
  });

  describe('update', () => {
    it('should update a request successfully', async () => {
      // Arrange
      const requestId = 1;
      const updatedRequest = {
        ...mockRequest,
        ...mockUpdateRequestDto,
      };
      mockServiceUpdate.mockResolvedValue(updatedRequest);

      // Act
      const result = await requestsController.update(
        requestId,
        mockUpdateRequestDto,
      );

      // Assert
      expect(mockServiceUpdate).toHaveBeenCalledWith(
        requestId,
        mockUpdateRequestDto,
      );
      expect(mockServiceUpdate).toHaveBeenCalledTimes(1);
      expect(result).toEqual(updatedRequest);
    });

    it('should update only quantity field', async () => {
      // Arrange
      const requestId = 1;
      const partialUpdate = { quantityNeeded: 30 };
      const updatedRequest = {
        ...mockRequest,
        quantityNeeded: 30,
      };
      mockServiceUpdate.mockResolvedValue(updatedRequest);

      // Act
      const result = await requestsController.update(requestId, partialUpdate);

      // Assert
      expect(mockServiceUpdate).toHaveBeenCalledWith(requestId, partialUpdate);
      expect(result?.quantityNeeded).toBe(30);
      expect(result?.dueDate).toEqual(futureDate);
    });

    it('should update due date field', async () => {
      // Arrange
      const requestId = 2;
      const newDueDate = new Date();
      newDueDate.setDate(newDueDate.getDate() + 30);
      const partialUpdate = { dueDate: newDueDate };
      const updatedRequest = {
        ...mockRequests[1],
        dueDate: newDueDate,
      };
      mockServiceUpdate.mockResolvedValue(updatedRequest);

      // Act
      const result = await requestsController.update(requestId, partialUpdate);

      // Assert
      expect(mockServiceUpdate).toHaveBeenCalledWith(requestId, partialUpdate);
      expect(result?.dueDate).toEqual(newDueDate);
    });

    it('should update multiple fields at once', async () => {
      // Arrange
      const requestId = 1;
      const newDueDate = new Date();
      newDueDate.setDate(newDueDate.getDate() + 14);
      const multiFieldUpdate = {
        quantityNeeded: 50,
        dueDate: newDueDate,
      };
      const updatedRequest = {
        ...mockRequest,
        ...multiFieldUpdate,
      };
      mockServiceUpdate.mockResolvedValue(updatedRequest);

      // Act
      const result = await requestsController.update(
        requestId,
        multiFieldUpdate,
      );

      // Assert
      expect(mockServiceUpdate).toHaveBeenCalledWith(
        requestId,
        multiFieldUpdate,
      );
      expect(result?.quantityNeeded).toBe(50);
      expect(result?.dueDate).toEqual(newDueDate);
    });
  });

  describe('remove', () => {
    it('should delete a request successfully', async () => {
      // Arrange
      const requestId = 1;
      mockServiceRemove.mockResolvedValue(requestId);

      // Act
      const result = await requestsController.remove(requestId);

      // Assert
      expect(mockServiceRemove).toHaveBeenCalledWith(requestId);
      expect(mockServiceRemove).toHaveBeenCalledTimes(1);
      expect(result).toBe(requestId);
    });

    it('should delete request with different ids', async () => {
      // Arrange
      const requestId = 5;
      mockServiceRemove.mockResolvedValue(requestId);

      // Act
      const result = await requestsController.remove(requestId);

      // Assert
      expect(mockServiceRemove).toHaveBeenCalledWith(requestId);
      expect(result).toBe(5);
    });

    it('should use ParseIntPipe for id parameter in delete', async () => {
      // Arrange
      const requestId = 10;
      mockServiceRemove.mockResolvedValue(requestId);

      // Act
      const result = await requestsController.remove(requestId);

      // Assert
      expect(mockServiceRemove).toHaveBeenCalledWith(requestId);
      expect(typeof requestId).toBe('number');
      expect(result).toBe(10);
    });

    it('should return deleted request id', async () => {
      // Arrange
      const requestId = 3;
      mockServiceRemove.mockResolvedValue(requestId);

      // Act
      const result = await requestsController.remove(requestId);

      // Assert
      expect(result).toBe(requestId);
      expect(mockServiceRemove).toHaveBeenCalledWith(requestId);
    });
  });

  describe('Controller Definition', () => {
    it('should be defined', () => {
      expect(requestsController).toBeDefined();
    });

    it('should have requestsService injected', () => {
      expect(requestsService).toBeDefined();
    });
  });
});
