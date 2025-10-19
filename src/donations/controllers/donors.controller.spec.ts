import { Test, TestingModule } from '@nestjs/testing';
import { DonorsController } from './donors.controller';
import { DonorsService } from '../services/donors.service';

describe('DonorsController', () => {
  let donorsController: DonorsController;
  let donorsService: DonorsService;

  // Mock data
  const mockUser = {
    id: 1,
    email: 'donor@example.com',
    role: {
      id: 1,
      name: 'donor',
      permissions: [],
    },
  };

  const mockBlood = {
    id: 1,
    type: 'O',
    rh: '+',
  };

  const mockDonor = {
    id: 1,
    document: '123456789',
    name: 'John',
    lastname: 'Doe',
    birthDate: new Date('1990-01-01'),
    user: mockUser,
    blood: mockBlood,
  };

  const mockDonors = [
    mockDonor,
    {
      id: 2,
      document: '987654321',
      name: 'Jane',
      lastname: 'Smith',
      birthDate: new Date('1992-05-15'),
      user: { ...mockUser, id: 2, email: 'jane@example.com' },
      blood: mockBlood,
    },
    {
      id: 3,
      document: '555666777',
      name: 'Bob',
      lastname: 'Johnson',
      birthDate: new Date('1988-08-20'),
      user: { ...mockUser, id: 3, email: 'bob@example.com' },
      blood: { ...mockBlood, id: 2, type: 'A' },
    },
  ];

  const mockCreateDonorDto = {
    document: '111222333',
    name: 'Alice',
    lastname: 'Johnson',
    birthDate: new Date('1995-03-20'),
    userId: 4,
    bloodId: 1,
  };

  const mockUpdateDonorDto = {
    name: 'UpdatedName',
    lastname: 'UpdatedLastname',
  };

  // Mock functions
  const mockServiceCreate = jest.fn();
  const mockServiceFindAll = jest.fn();
  const mockServiceFindOne = jest.fn();
  const mockServiceUpdate = jest.fn();
  const mockServiceRemove = jest.fn();

  const mockDonorsService = {
    create: mockServiceCreate,
    findAll: mockServiceFindAll,
    findOne: mockServiceFindOne,
    update: mockServiceUpdate,
    remove: mockServiceRemove,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DonorsController],
      providers: [
        {
          provide: DonorsService,
          useValue: mockDonorsService,
        },
      ],
    }).compile();

    donorsController = module.get<DonorsController>(DonorsController);
    donorsService = module.get<DonorsService>(DonorsService);

    // Limpiar mocks antes de cada test
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new donor successfully', async () => {
      // Arrange
      const newDonor = {
        id: 4,
        ...mockCreateDonorDto,
        user: mockUser,
        blood: mockBlood,
      };
      mockServiceCreate.mockResolvedValue(newDonor);

      // Act
      const result = await donorsController.create(mockCreateDonorDto);

      // Assert
      expect(mockServiceCreate).toHaveBeenCalledWith(mockCreateDonorDto);
      expect(mockServiceCreate).toHaveBeenCalledTimes(1);
      expect(result).toEqual(newDonor);
    });

    it('should create donor with different blood types', async () => {
      // Arrange
      const donorDtoAB = {
        ...mockCreateDonorDto,
        bloodId: 3,
      };
      const newDonorAB = {
        id: 5,
        ...donorDtoAB,
        user: mockUser,
        blood: { id: 3, type: 'AB', rh: '-' },
      };
      mockServiceCreate.mockResolvedValue(newDonorAB);

      // Act
      const result = await donorsController.create(donorDtoAB);

      // Assert
      expect(mockServiceCreate).toHaveBeenCalledWith(donorDtoAB);
      expect(result?.blood?.type).toBe('AB');
      expect(result?.blood?.rh).toBe('-');
    });

    it('should pass validation for donor with valid birthDate', async () => {
      // Arrange
      const donorWithOldBirthDate = {
        ...mockCreateDonorDto,
        birthDate: new Date('1970-01-01'),
      };
      const createdDonor = {
        id: 6,
        ...donorWithOldBirthDate,
        user: mockUser,
        blood: mockBlood,
      };
      mockServiceCreate.mockResolvedValue(createdDonor);

      // Act
      const result = await donorsController.create(donorWithOldBirthDate);

      // Assert
      expect(mockServiceCreate).toHaveBeenCalledWith(donorWithOldBirthDate);
      expect(result?.birthDate).toEqual(new Date('1970-01-01'));
    });

    it('should create donor and associate with existing user', async () => {
      // Arrange
      const donorDto = {
        ...mockCreateDonorDto,
        userId: 10,
      };
      const existingUser = {
        id: 10,
        email: 'existing@example.com',
        role: mockUser.role,
      };
      const createdDonor = {
        id: 7,
        ...donorDto,
        user: existingUser,
        blood: mockBlood,
      };
      mockServiceCreate.mockResolvedValue(createdDonor);

      // Act
      const result = await donorsController.create(donorDto);

      // Assert
      expect(mockServiceCreate).toHaveBeenCalledWith(donorDto);
      expect(result?.user?.id).toBe(10);
      expect(result?.user?.email).toBe('existing@example.com');
    });
  });

  describe('findAll', () => {
    it('should return all donors', async () => {
      // Arrange
      mockServiceFindAll.mockResolvedValue(mockDonors);

      // Act
      const result = await donorsController.findAll();

      // Assert
      expect(mockServiceFindAll).toHaveBeenCalled();
      expect(mockServiceFindAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockDonors);
      expect(result).toHaveLength(3);
    });

    it('should return donors with different blood types', async () => {
      // Arrange
      mockServiceFindAll.mockResolvedValue(mockDonors);

      // Act
      const result = await donorsController.findAll();

      // Assert
      expect(result).toHaveLength(3);
      expect(result?.[0]?.blood?.type).toBe('O');
      expect(result?.[2]?.blood?.type).toBe('A');
    });

    it('should return donors sorted by creation order', async () => {
      // Arrange
      mockServiceFindAll.mockResolvedValue(mockDonors);

      // Act
      const result = await donorsController.findAll();

      // Assert
      expect(result?.[0]?.id).toBe(1);
      expect(result?.[1]?.id).toBe(2);
      expect(result?.[2]?.id).toBe(3);
    });

    it('should call service without parameters', async () => {
      // Arrange
      mockServiceFindAll.mockResolvedValue(mockDonors);

      // Act
      await donorsController.findAll();

      // Assert
      expect(mockServiceFindAll).toHaveBeenCalledWith();
    });
  });

  describe('findOne', () => {
    it('should return a donor by id', async () => {
      // Arrange
      const donorId = 1;
      mockServiceFindOne.mockResolvedValue(mockDonor);

      // Act
      const result = await donorsController.findOne(donorId);

      // Assert
      expect(mockServiceFindOne).toHaveBeenCalledWith(donorId);
      expect(mockServiceFindOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockDonor);
    });

    it('should return donor with all associated data', async () => {
      // Arrange
      const donorId = 1;
      mockServiceFindOne.mockResolvedValue(mockDonor);

      // Act
      const result = await donorsController.findOne(donorId);

      // Assert
      expect(result?.user).toBeDefined();
      expect(result?.blood).toBeDefined();
      expect(result?.document).toBe('123456789');
    });

    it('should handle different donor ids', async () => {
      // Arrange
      const donorId = 2;
      const donor2 = mockDonors[1];
      mockServiceFindOne.mockResolvedValue(donor2);

      // Act
      const result = await donorsController.findOne(donorId);

      // Assert
      expect(mockServiceFindOne).toHaveBeenCalledWith(donorId);
      expect(result?.id).toBe(2);
      expect(result?.name).toBe('Jane');
    });

    it('should use ParseIntPipe for id parameter', async () => {
      // Arrange
      const donorId = 3;
      const donor3 = mockDonors[2];
      mockServiceFindOne.mockResolvedValue(donor3);

      // Act
      const result = await donorsController.findOne(donorId);

      // Assert
      expect(mockServiceFindOne).toHaveBeenCalledWith(donorId);
      expect(typeof donorId).toBe('number');
      expect(result?.id).toBe(3);
    });
  });

  describe('update', () => {
    it('should update a donor successfully', async () => {
      // Arrange
      const donorId = 1;
      const updatedDonor = {
        ...mockDonor,
        ...mockUpdateDonorDto,
      };
      mockServiceUpdate.mockResolvedValue(updatedDonor);

      // Act
      const result = await donorsController.update(donorId, mockUpdateDonorDto);

      // Assert
      expect(mockServiceUpdate).toHaveBeenCalledWith(donorId, mockUpdateDonorDto);
      expect(mockServiceUpdate).toHaveBeenCalledTimes(1);
      expect(result).toEqual(updatedDonor);
    });

    it('should update only name field', async () => {
      // Arrange
      const donorId = 1;
      const partialUpdate = { name: 'NewName' };
      const updatedDonor = {
        ...mockDonor,
        name: 'NewName',
      };
      mockServiceUpdate.mockResolvedValue(updatedDonor);

      // Act
      const result = await donorsController.update(donorId, partialUpdate);

      // Assert
      expect(mockServiceUpdate).toHaveBeenCalledWith(donorId, partialUpdate);
      expect(result?.name).toBe('NewName');
      expect(result?.lastname).toBe('Doe');
    });

    it('should update only lastname field', async () => {
      // Arrange
      const donorId = 2;
      const partialUpdate = { lastname: 'NewLastname' };
      const updatedDonor = {
        ...mockDonors[1],
        lastname: 'NewLastname',
      };
      mockServiceUpdate.mockResolvedValue(updatedDonor);

      // Act
      const result = await donorsController.update(donorId, partialUpdate);

      // Assert
      expect(mockServiceUpdate).toHaveBeenCalledWith(donorId, partialUpdate);
      expect(result?.lastname).toBe('NewLastname');
      expect(result?.name).toBe('Jane');
    });

    it('should update donor with userId change', async () => {
      // Arrange
      const donorId = 1;
      const updateWithUserId = {
        userId: 5,
      };
      const updatedDonor = {
        ...mockDonor,
        user: { ...mockUser, id: 5, email: 'newuser@example.com' },
      };
      mockServiceUpdate.mockResolvedValue(updatedDonor);

      // Act
      const result = await donorsController.update(donorId, updateWithUserId);

      // Assert
      expect(mockServiceUpdate).toHaveBeenCalledWith(donorId, updateWithUserId);
      expect(result?.user?.id).toBe(5);
    });
  });

  describe('remove', () => {
    it('should delete a donor successfully', async () => {
      // Arrange
      const donorId = 1;
      mockServiceRemove.mockResolvedValue(donorId);

      // Act
      const result = await donorsController.remove(donorId);

      // Assert
      expect(mockServiceRemove).toHaveBeenCalledWith(donorId);
      expect(mockServiceRemove).toHaveBeenCalledTimes(1);
      expect(result).toBe(donorId);
    });

    it('should delete donor with different ids', async () => {
      // Arrange
      const donorId = 5;
      mockServiceRemove.mockResolvedValue(donorId);

      // Act
      const result = await donorsController.remove(donorId);

      // Assert
      expect(mockServiceRemove).toHaveBeenCalledWith(donorId);
      expect(result).toBe(5);
    });

    it('should use ParseIntPipe for id parameter in delete', async () => {
      // Arrange
      const donorId = 10;
      mockServiceRemove.mockResolvedValue(donorId);

      // Act
      const result = await donorsController.remove(donorId);

      // Assert
      expect(mockServiceRemove).toHaveBeenCalledWith(donorId);
      expect(typeof donorId).toBe('number');
      expect(result).toBe(10);
    });

    it('should return deleted donor id', async () => {
      // Arrange
      const donorId = 3;
      mockServiceRemove.mockResolvedValue(donorId);

      // Act
      const result = await donorsController.remove(donorId);

      // Assert
      expect(result).toBe(donorId);
      expect(mockServiceRemove).toHaveBeenCalledWith(donorId);
    });
  });

  describe('Controller Definition', () => {
    it('should be defined', () => {
      expect(donorsController).toBeDefined();
    });

    it('should have donorsService injected', () => {
      expect(donorsService).toBeDefined();
    });
  });
});
