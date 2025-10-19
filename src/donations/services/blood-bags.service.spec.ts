import { Test, TestingModule } from '@nestjs/testing';
import { BloodBagsService } from './blood-bags.service';
import { BloodsService } from './bloods.service';
import { DonorsService } from './donors.service';
import { RequestsService } from './requests.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BloodBag } from '../entities/blood-bag.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Type, Rh } from '../entities/blood.entity';
import { InstitutionType } from '../entities/health-entity.entity';

describe('BloodBagsService', () => {
  let bloodBagsService: BloodBagsService;
  let bloodsService: BloodsService;
  let donorsService: DonorsService;
  let requestsService: RequestsService;
  let bloodBagRepository: Repository<BloodBag>;

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
  futureDate.setDate(futureDate.getDate() + 30); // 30 días en el futuro

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
      blood: mockBlood,
      donor: mockDonor,
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
  const mockBloodsFindOne = jest.fn();
  const mockDonorsFindOne = jest.fn();
  const mockRequestsFindOne = jest.fn();
  const mockBloodBagCreate = jest.fn();
  const mockBloodBagSave = jest.fn();
  const mockBloodBagFind = jest.fn();
  const mockBloodBagFindOne = jest.fn();
  const mockBloodBagUpdate = jest.fn();
  const mockBloodBagDelete = jest.fn();

  const mockBloodsService = {
    findOne: mockBloodsFindOne,
  };

  const mockDonorsService = {
    findOne: mockDonorsFindOne,
  };

  const mockRequestsService = {
    findOne: mockRequestsFindOne,
  };

  const mockBloodBagRepository = {
    create: mockBloodBagCreate,
    save: mockBloodBagSave,
    find: mockBloodBagFind,
    findOne: mockBloodBagFindOne,
    update: mockBloodBagUpdate,
    delete: mockBloodBagDelete,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BloodBagsService,
        {
          provide: BloodsService,
          useValue: mockBloodsService,
        },
        {
          provide: DonorsService,
          useValue: mockDonorsService,
        },
        {
          provide: RequestsService,
          useValue: mockRequestsService,
        },
        {
          provide: getRepositoryToken(BloodBag),
          useValue: mockBloodBagRepository,
        },
      ],
    }).compile();

    bloodBagsService = module.get<BloodBagsService>(BloodBagsService);
    bloodsService = module.get<BloodsService>(BloodsService);
    donorsService = module.get<DonorsService>(DonorsService);
    requestsService = module.get<RequestsService>(RequestsService);
    bloodBagRepository = module.get<Repository<BloodBag>>(
      getRepositoryToken(BloodBag),
    );

    // Limpiar mocks antes de cada test
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new blood bag successfully', async () => {
      // Arrange
      const newBloodBag = {
        id: 3,
        ...mockCreateBloodBagDto,
        blood: mockBlood,
        donor: mockDonor,
        request: mockRequest,
      };

      mockBloodsFindOne.mockResolvedValue(mockBlood);
      mockDonorsFindOne.mockResolvedValue(mockDonor);
      mockRequestsFindOne.mockResolvedValue(mockRequest);
      mockBloodBagCreate.mockReturnValue(newBloodBag);
      mockBloodBagSave.mockResolvedValue(newBloodBag);

      // Act
      const result = await bloodBagsService.create(mockCreateBloodBagDto);

      // Assert
      expect(mockBloodsFindOne).toHaveBeenCalledWith(
        mockCreateBloodBagDto.bloodId,
      );
      expect(mockDonorsFindOne).toHaveBeenCalledWith(
        mockCreateBloodBagDto.donorId,
      );
      expect(mockRequestsFindOne).toHaveBeenCalledWith(
        mockCreateBloodBagDto.requestId,
      );
      expect(mockBloodBagCreate).toHaveBeenCalledWith({
        ...mockCreateBloodBagDto,
        blood: mockBlood,
        donor: mockDonor,
        request: mockRequest,
      });
      expect(mockBloodBagSave).toHaveBeenCalledWith(newBloodBag);
      expect(result).toEqual(newBloodBag);
    });

    it('should throw NotFoundException when blood type does not exist', async () => {
      // Arrange
      mockBloodsFindOne.mockResolvedValue(null);
      mockDonorsFindOne.mockResolvedValue(mockDonor);
      mockRequestsFindOne.mockResolvedValue(mockRequest);

      // Act & Assert
      await expect(
        bloodBagsService.create(mockCreateBloodBagDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        bloodBagsService.create(mockCreateBloodBagDto),
      ).rejects.toThrow('Blood type not found');
      expect(mockBloodsFindOne).toHaveBeenCalledWith(
        mockCreateBloodBagDto.bloodId,
      );
      expect(mockBloodBagSave).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when donor does not exist', async () => {
      // Arrange
      mockBloodsFindOne.mockResolvedValue(mockBlood);
      mockDonorsFindOne.mockResolvedValue(null);
      mockRequestsFindOne.mockResolvedValue(mockRequest);

      // Act & Assert
      await expect(
        bloodBagsService.create(mockCreateBloodBagDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        bloodBagsService.create(mockCreateBloodBagDto),
      ).rejects.toThrow('Donor not found');
      expect(mockDonorsFindOne).toHaveBeenCalledWith(
        mockCreateBloodBagDto.donorId,
      );
      expect(mockBloodBagSave).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when request does not exist', async () => {
      // Arrange
      mockBloodsFindOne.mockResolvedValue(mockBlood);
      mockDonorsFindOne.mockResolvedValue(mockDonor);
      mockRequestsFindOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        bloodBagsService.create(mockCreateBloodBagDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        bloodBagsService.create(mockCreateBloodBagDto),
      ).rejects.toThrow('Request not found');
      expect(mockRequestsFindOne).toHaveBeenCalledWith(
        mockCreateBloodBagDto.requestId,
      );
      expect(mockBloodBagSave).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when blood type does not match request', async () => {
      // Arrange
      const differentBlood = {
        ...mockBlood,
        id: 2,
        type: Type.A,
      };
      mockBloodsFindOne.mockResolvedValue(differentBlood);
      mockDonorsFindOne.mockResolvedValue(mockDonor);
      mockRequestsFindOne.mockResolvedValue(mockRequest);

      // Act & Assert
      await expect(
        bloodBagsService.create(mockCreateBloodBagDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        bloodBagsService.create(mockCreateBloodBagDto),
      ).rejects.toThrow('Blood type does not match the request');
      expect(mockBloodBagSave).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when quantity is negative', async () => {
      // Arrange
      const invalidDto = {
        ...mockCreateBloodBagDto,
        quantity: -100,
      };
      mockBloodsFindOne.mockResolvedValue(mockBlood);
      mockDonorsFindOne.mockResolvedValue(mockDonor);
      mockRequestsFindOne.mockResolvedValue(mockRequest);

      // Act & Assert
      await expect(bloodBagsService.create(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(bloodBagsService.create(invalidDto)).rejects.toThrow(
        'Quantity must be greater than zero',
      );
      expect(mockBloodBagSave).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when expiration date is in the past', async () => {
      // Arrange
      const invalidDto = {
        ...mockCreateBloodBagDto,
        expirationDate: pastDate,
      };
      mockBloodsFindOne.mockResolvedValue(mockBlood);
      mockDonorsFindOne.mockResolvedValue(mockDonor);
      mockRequestsFindOne.mockResolvedValue(mockRequest);

      // Act & Assert
      await expect(bloodBagsService.create(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(bloodBagsService.create(invalidDto)).rejects.toThrow(
        'Expiration date must be a future date',
      );
      expect(mockBloodBagSave).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when expiration date is today', async () => {
      // Arrange
      const invalidDto = {
        ...mockCreateBloodBagDto,
        expirationDate: new Date(),
      };
      mockBloodsFindOne.mockResolvedValue(mockBlood);
      mockDonorsFindOne.mockResolvedValue(mockDonor);
      mockRequestsFindOne.mockResolvedValue(mockRequest);

      // Act & Assert
      await expect(bloodBagsService.create(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(bloodBagsService.create(invalidDto)).rejects.toThrow(
        'Expiration date must be a future date',
      );
      expect(mockBloodBagSave).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all blood bags', async () => {
      // Arrange
      mockBloodBagFind.mockResolvedValue(mockBloodBags);

      // Act
      const result = await bloodBagsService.findAll();

      // Assert
      expect(mockBloodBagFind).toHaveBeenCalled();
      expect(result).toEqual(mockBloodBags);
      expect(result).toHaveLength(2);
    });

    it('should throw NotFoundException when no blood bags are found', async () => {
      // Arrange
      mockBloodBagFind.mockResolvedValue([]);

      // Act & Assert
      await expect(bloodBagsService.findAll()).rejects.toThrow(
        NotFoundException,
      );
      await expect(bloodBagsService.findAll()).rejects.toThrow(
        'No users found',
      );
      expect(mockBloodBagFind).toHaveBeenCalled();
    });

    it('should throw NotFoundException when blood bags is null', async () => {
      // Arrange
      mockBloodBagFind.mockResolvedValue(null);

      // Act & Assert
      await expect(bloodBagsService.findAll()).rejects.toThrow(
        NotFoundException,
      );
      await expect(bloodBagsService.findAll()).rejects.toThrow(
        'No users found',
      );
    });
  });

  describe('findOne', () => {
    it('should return a blood bag by id', async () => {
      // Arrange
      const bloodBagId = 1;
      mockBloodBagFindOne.mockResolvedValue(mockBloodBag);

      // Act
      const result = await bloodBagsService.findOne(bloodBagId);

      // Assert
      expect(mockBloodBagFindOne).toHaveBeenCalledWith({
        where: { id: bloodBagId },
      });
      expect(result).toEqual(mockBloodBag);
    });

    it('should throw NotFoundException when blood bag is not found', async () => {
      // Arrange
      const bloodBagId = 999;
      mockBloodBagFindOne.mockResolvedValue(null);

      // Act & Assert
      await expect(bloodBagsService.findOne(bloodBagId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(bloodBagsService.findOne(bloodBagId)).rejects.toThrow(
        'Donor not found',
      );
      expect(mockBloodBagFindOne).toHaveBeenCalledWith({
        where: { id: bloodBagId },
      });
    });
  });

  describe('update', () => {
    it('should update a blood bag successfully', async () => {
      // Arrange
      const bloodBagId = 1;
      const updatedBloodBag = { ...mockBloodBag, ...mockUpdateBloodBagDto };
      mockBloodBagUpdate.mockResolvedValue({ affected: 1 });
      mockBloodBagFindOne.mockResolvedValue(updatedBloodBag);

      // Act
      const result = await bloodBagsService.update(
        bloodBagId,
        mockUpdateBloodBagDto,
      );

      // Assert
      expect(mockBloodBagUpdate).toHaveBeenCalledWith(
        bloodBagId,
        mockUpdateBloodBagDto,
      );
      expect(mockBloodBagFindOne).toHaveBeenCalledWith({
        where: { id: bloodBagId },
      });
      expect(result).toEqual(updatedBloodBag);
    });

    it('should throw NotFoundException when blood bag is not updated', async () => {
      // Arrange
      const bloodBagId = 999;
      mockBloodBagUpdate.mockResolvedValue({ affected: 0 });

      // Act & Assert
      await expect(
        bloodBagsService.update(bloodBagId, mockUpdateBloodBagDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        bloodBagsService.update(bloodBagId, mockUpdateBloodBagDto),
      ).rejects.toThrow('Blood bag not updated');
      expect(mockBloodBagUpdate).toHaveBeenCalledWith(
        bloodBagId,
        mockUpdateBloodBagDto,
      );
      expect(mockBloodBagFindOne).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a blood bag successfully', async () => {
      // Arrange
      const bloodBagId = 1;
      mockBloodBagDelete.mockResolvedValue({ affected: 1 });

      // Act
      const result = await bloodBagsService.remove(bloodBagId);

      // Assert
      expect(mockBloodBagDelete).toHaveBeenCalledWith(bloodBagId);
      expect(result).toBe(bloodBagId);
    });

    it('should throw NotFoundException when blood bag is not found', async () => {
      // Arrange
      const bloodBagId = 999;
      mockBloodBagDelete.mockResolvedValue({ affected: 0 });

      // Act & Assert
      await expect(bloodBagsService.remove(bloodBagId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(bloodBagsService.remove(bloodBagId)).rejects.toThrow(
        'Blood bag not deleted',
      );
      expect(mockBloodBagDelete).toHaveBeenCalledWith(bloodBagId);
    });
  });

  describe('removeByRequestId', () => {
    it('should delete all blood bags for a request', async () => {
      // Arrange
      const requestId = 1;
      mockBloodBagDelete.mockResolvedValue({ affected: 2 });

      // Act
      await bloodBagsService.removeByRequestId(requestId);

      // Assert
      expect(mockBloodBagDelete).toHaveBeenCalledWith({
        request: { id: requestId },
      });
    });

    it('should handle deletion when no blood bags exist for request', async () => {
      // Arrange
      const requestId = 999;
      mockBloodBagDelete.mockResolvedValue({ affected: 0 });

      // Act
      await bloodBagsService.removeByRequestId(requestId);

      // Assert
      expect(mockBloodBagDelete).toHaveBeenCalledWith({
        request: { id: requestId },
      });
    });

    it('should not throw error when deleting non-existent blood bags', async () => {
      // Arrange
      const requestId = 123;
      mockBloodBagDelete.mockResolvedValue({ affected: 0 });

      // Act & Assert
      await expect(
        bloodBagsService.removeByRequestId(requestId),
      ).resolves.not.toThrow();
      expect(mockBloodBagDelete).toHaveBeenCalledWith({
        request: { id: requestId },
      });
    });
  });

  describe('Service Definition', () => {
    it('should be defined', () => {
      expect(bloodBagsService).toBeDefined();
    });

    it('should have bloodBagRepository injected', () => {
      expect(bloodBagRepository).toBeDefined();
    });

    it('should have bloodsService injected', () => {
      expect(bloodsService).toBeDefined();
    });

    it('should have donorsService injected', () => {
      expect(donorsService).toBeDefined();
    });

    it('should have requestsService injected', () => {
      expect(requestsService).toBeDefined();
    });
  });
});
