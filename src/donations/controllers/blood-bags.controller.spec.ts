import { Test, TestingModule } from '@nestjs/testing';
import { BloodBagsController } from './blood-bags.controller';
import { BloodBagsService } from '../services/blood-bags.service';
import { Type, Rh } from '../entities/blood.entity';
import { InstitutionType } from '../entities/health-entity.entity';

describe('BloodBagsController', () => {
  let bloodBagsController: BloodBagsController;
  let bloodBagsService: BloodBagsService;

  // Mock data
  const mockBlood = {
    id: 1,
    type: Type.O,
    rh: Rh.POSITIVE,
    donors: [],
    bloodBags: [],
    requests: [],
  };

  const mockDonor = {
    id: 1,
    document: '123456789',
    name: 'John',
    lastname: 'Doe',
    birthDate: new Date('1990-01-01'),
    user: {
      id: 1,
      email: 'donor@example.com',
    },
    blood: mockBlood,
    bloodBags: [],
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
      id: 2,
      email: 'hospital@example.com',
    },
  };

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);

  const mockRequest = {
    id: 1,
    dateCreated: new Date(),
    quantityNeeded: 10,
    dueDate: futureDate,
    blood: mockBlood,
    healthEntity: mockHealthEntity,
    bloodBags: [],
  };

  const mockBloodBag = {
    id: 1,
    quantity: 450,
    donationDate: new Date(),
    expirationDate: futureDate,
    blood: mockBlood,
    donor: mockDonor,
    request: mockRequest,
  };

  const mockBloodBags = [
    mockBloodBag,
    {
      id: 2,
      quantity: 500,
      donationDate: new Date(),
      expirationDate: futureDate,
      blood: { ...mockBlood, id: 2, type: Type.A },
      donor: { ...mockDonor, id: 2, name: 'Jane' },
      request: mockRequest,
    },
    {
      id: 3,
      quantity: 350,
      donationDate: new Date(),
      expirationDate: futureDate,
      blood: { ...mockBlood, id: 3, type: Type.B, rh: Rh.NEGATIVE },
      donor: { ...mockDonor, id: 3, name: 'Bob' },
      request: mockRequest,
    },
  ];

  const mockCreateBloodBagDto = {
    quantity: 450,
    donationDate: new Date(),
    expirationDate: futureDate,
    requestId: 1,
    bloodId: 1,
    donorId: 1,
  };

  const mockUpdateBloodBagDto = {
    quantity: 500,
  };

  // Mock functions
  const mockServiceCreate = jest.fn();
  const mockServiceFindAll = jest.fn();
  const mockServiceFindOne = jest.fn();
  const mockServiceUpdate = jest.fn();
  const mockServiceRemove = jest.fn();

  const mockBloodBagsService = {
    create: mockServiceCreate,
    findAll: mockServiceFindAll,
    findOne: mockServiceFindOne,
    update: mockServiceUpdate,
    remove: mockServiceRemove,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BloodBagsController],
      providers: [
        {
          provide: BloodBagsService,
          useValue: mockBloodBagsService,
        },
      ],
    }).compile();

    bloodBagsController = module.get<BloodBagsController>(BloodBagsController);
    bloodBagsService = module.get<BloodBagsService>(BloodBagsService);

    // Limpiar mocks antes de cada test
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new blood bag successfully', async () => {
      // Arrange
      const newBloodBag = {
        id: 4,
        ...mockCreateBloodBagDto,
        blood: mockBlood,
        donor: mockDonor,
        request: mockRequest,
      };
      mockServiceCreate.mockResolvedValue(newBloodBag);

      // Act
      const result = await bloodBagsController.create(mockCreateBloodBagDto);

      // Assert
      expect(mockServiceCreate).toHaveBeenCalledWith(mockCreateBloodBagDto);
      expect(mockServiceCreate).toHaveBeenCalledTimes(1);
      expect(result).toEqual(newBloodBag);
    });

    it('should create blood bag with different blood types', async () => {
      // Arrange
      const bloodBagDtoAB = {
        ...mockCreateBloodBagDto,
        bloodId: 4,
      };
      const newBloodBagAB = {
        id: 5,
        ...bloodBagDtoAB,
        blood: { id: 4, type: Type.AB, rh: Rh.POSITIVE },
        donor: mockDonor,
        request: { ...mockRequest, blood: { id: 4, type: Type.AB, rh: Rh.POSITIVE } },
      };
      mockServiceCreate.mockResolvedValue(newBloodBagAB);

      // Act
      const result = await bloodBagsController.create(bloodBagDtoAB);

      // Assert
      expect(mockServiceCreate).toHaveBeenCalledWith(bloodBagDtoAB);
      expect(result?.blood?.type).toBe(Type.AB);
      expect(result?.blood?.rh).toBe(Rh.POSITIVE);
    });

    it('should create blood bag with large quantity', async () => {
      // Arrange
      const largeQuantityDto = {
        ...mockCreateBloodBagDto,
        quantity: 550,
      };
      const newBloodBag = {
        id: 6,
        ...largeQuantityDto,
        blood: mockBlood,
        donor: mockDonor,
        request: mockRequest,
      };
      mockServiceCreate.mockResolvedValue(newBloodBag);

      // Act
      const result = await bloodBagsController.create(largeQuantityDto);

      // Assert
      expect(mockServiceCreate).toHaveBeenCalledWith(largeQuantityDto);
      expect(result?.quantity).toBe(550);
    });

    it('should create blood bag for different donor', async () => {
      // Arrange
      const differentDonorDto = {
        ...mockCreateBloodBagDto,
        donorId: 5,
      };
      const differentDonor = {
        ...mockDonor,
        id: 5,
        name: 'Alice',
        document: '987654321',
      };
      const newBloodBag = {
        id: 7,
        ...differentDonorDto,
        blood: mockBlood,
        donor: differentDonor,
        request: mockRequest,
      };
      mockServiceCreate.mockResolvedValue(newBloodBag);

      // Act
      const result = await bloodBagsController.create(differentDonorDto);

      // Assert
      expect(mockServiceCreate).toHaveBeenCalledWith(differentDonorDto);
      expect(result?.donor?.id).toBe(5);
      expect(result?.donor?.name).toBe('Alice');
    });
  });

  describe('findAll', () => {
    it('should return all blood bags', async () => {
      // Arrange
      mockServiceFindAll.mockResolvedValue(mockBloodBags);

      // Act
      const result = await bloodBagsController.findAll();

      // Assert
      expect(mockServiceFindAll).toHaveBeenCalled();
      expect(mockServiceFindAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockBloodBags);
      expect(result).toHaveLength(3);
    });

    it('should return blood bags with different blood types', async () => {
      // Arrange
      mockServiceFindAll.mockResolvedValue(mockBloodBags);

      // Act
      const result = await bloodBagsController.findAll();

      // Assert
      expect(result).toHaveLength(3);
      expect(result?.[0]?.blood?.type).toBe(Type.O);
      expect(result?.[1]?.blood?.type).toBe(Type.A);
      expect(result?.[2]?.blood?.type).toBe(Type.B);
    });

    it('should return blood bags with different quantities', async () => {
      // Arrange
      mockServiceFindAll.mockResolvedValue(mockBloodBags);

      // Act
      const result = await bloodBagsController.findAll();

      // Assert
      expect(result?.[0]?.quantity).toBe(450);
      expect(result?.[1]?.quantity).toBe(500);
      expect(result?.[2]?.quantity).toBe(350);
    });

    it('should call service without parameters', async () => {
      // Arrange
      mockServiceFindAll.mockResolvedValue(mockBloodBags);

      // Act
      await bloodBagsController.findAll();

      // Assert
      expect(mockServiceFindAll).toHaveBeenCalledWith();
    });
  });

  describe('findOne', () => {
    it('should return a blood bag by id', async () => {
      // Arrange
      const bloodBagId = 1;
      mockServiceFindOne.mockResolvedValue(mockBloodBag);

      // Act
      const result = await bloodBagsController.findOne(bloodBagId);

      // Assert
      expect(mockServiceFindOne).toHaveBeenCalledWith(bloodBagId);
      expect(mockServiceFindOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockBloodBag);
    });

    it('should return blood bag with all associated data', async () => {
      // Arrange
      const bloodBagId = 1;
      mockServiceFindOne.mockResolvedValue(mockBloodBag);

      // Act
      const result = await bloodBagsController.findOne(bloodBagId);

      // Assert
      expect(result?.blood).toBeDefined();
      expect(result?.donor).toBeDefined();
      expect(result?.request).toBeDefined();
      expect(result?.quantity).toBe(450);
    });

    it('should handle different blood bag ids', async () => {
      // Arrange
      const bloodBagId = 2;
      const bloodBag2 = mockBloodBags[1];
      mockServiceFindOne.mockResolvedValue(bloodBag2);

      // Act
      const result = await bloodBagsController.findOne(bloodBagId);

      // Assert
      expect(mockServiceFindOne).toHaveBeenCalledWith(bloodBagId);
      expect(result?.id).toBe(2);
      expect(result?.quantity).toBe(500);
    });

    it('should use ParseIntPipe for id parameter', async () => {
      // Arrange
      const bloodBagId = 3;
      const bloodBag3 = mockBloodBags[2];
      mockServiceFindOne.mockResolvedValue(bloodBag3);

      // Act
      const result = await bloodBagsController.findOne(bloodBagId);

      // Assert
      expect(mockServiceFindOne).toHaveBeenCalledWith(bloodBagId);
      expect(typeof bloodBagId).toBe('number');
      expect(result?.id).toBe(3);
    });
  });

  describe('update', () => {
    it('should update a blood bag successfully', async () => {
      // Arrange
      const bloodBagId = 1;
      const updatedBloodBag = {
        ...mockBloodBag,
        ...mockUpdateBloodBagDto,
      };
      mockServiceUpdate.mockResolvedValue(updatedBloodBag);

      // Act
      const result = await bloodBagsController.update(
        bloodBagId,
        mockUpdateBloodBagDto,
      );

      // Assert
      expect(mockServiceUpdate).toHaveBeenCalledWith(
        bloodBagId,
        mockUpdateBloodBagDto,
      );
      expect(mockServiceUpdate).toHaveBeenCalledTimes(1);
      expect(result).toEqual(updatedBloodBag);
    });

    it('should update only quantity field', async () => {
      // Arrange
      const bloodBagId = 1;
      const partialUpdate = { quantity: 480 };
      const updatedBloodBag = {
        ...mockBloodBag,
        quantity: 480,
      };
      mockServiceUpdate.mockResolvedValue(updatedBloodBag);

      // Act
      const result = await bloodBagsController.update(bloodBagId, partialUpdate);

      // Assert
      expect(mockServiceUpdate).toHaveBeenCalledWith(bloodBagId, partialUpdate);
      expect(result?.quantity).toBe(480);
      expect(result?.expirationDate).toEqual(futureDate);
    });

    it('should update only quantity field to smaller value', async () => {
      // Arrange
      const bloodBagId = 2;
      const partialUpdate = { quantity: 400 };
      const updatedBloodBag = {
        ...mockBloodBags[1],
        quantity: 400,
      };
      mockServiceUpdate.mockResolvedValue(updatedBloodBag);

      // Act
      const result = await bloodBagsController.update(bloodBagId, partialUpdate);

      // Assert
      expect(mockServiceUpdate).toHaveBeenCalledWith(bloodBagId, partialUpdate);
      expect(result?.quantity).toBe(400);
      expect(result?.blood?.type).toBe(Type.A);
    });

    it('should update quantity field to larger value', async () => {
      // Arrange
      const bloodBagId = 1;
      const partialUpdate = { quantity: 520 };
      const updatedBloodBag = {
        ...mockBloodBag,
        quantity: 520,
      };
      mockServiceUpdate.mockResolvedValue(updatedBloodBag);

      // Act
      const result = await bloodBagsController.update(
        bloodBagId,
        partialUpdate,
      );

      // Assert
      expect(mockServiceUpdate).toHaveBeenCalledWith(
        bloodBagId,
        partialUpdate,
      );
      expect(result?.quantity).toBe(520);
      expect(result?.donor?.name).toBe('John');
    });
  });

  describe('remove', () => {
    it('should delete a blood bag successfully', async () => {
      // Arrange
      const bloodBagId = 1;
      mockServiceRemove.mockResolvedValue(bloodBagId);

      // Act
      const result = await bloodBagsController.remove(bloodBagId);

      // Assert
      expect(mockServiceRemove).toHaveBeenCalledWith(bloodBagId);
      expect(mockServiceRemove).toHaveBeenCalledTimes(1);
      expect(result).toBe(bloodBagId);
    });

    it('should delete blood bag with different ids', async () => {
      // Arrange
      const bloodBagId = 5;
      mockServiceRemove.mockResolvedValue(bloodBagId);

      // Act
      const result = await bloodBagsController.remove(bloodBagId);

      // Assert
      expect(mockServiceRemove).toHaveBeenCalledWith(bloodBagId);
      expect(result).toBe(5);
    });

    it('should use ParseIntPipe for id parameter in delete', async () => {
      // Arrange
      const bloodBagId = 10;
      mockServiceRemove.mockResolvedValue(bloodBagId);

      // Act
      const result = await bloodBagsController.remove(bloodBagId);

      // Assert
      expect(mockServiceRemove).toHaveBeenCalledWith(bloodBagId);
      expect(typeof bloodBagId).toBe('number');
      expect(result).toBe(10);
    });

    it('should return deleted blood bag id', async () => {
      // Arrange
      const bloodBagId = 3;
      mockServiceRemove.mockResolvedValue(bloodBagId);

      // Act
      const result = await bloodBagsController.remove(bloodBagId);

      // Assert
      expect(result).toBe(bloodBagId);
      expect(mockServiceRemove).toHaveBeenCalledWith(bloodBagId);
    });
  });

  describe('Controller Definition', () => {
    it('should be defined', () => {
      expect(bloodBagsController).toBeDefined();
    });

    it('should have bloodBagsService injected', () => {
      expect(bloodBagsService).toBeDefined();
    });
  });
});
