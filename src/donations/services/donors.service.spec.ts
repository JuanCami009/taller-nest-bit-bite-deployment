import { Test, TestingModule } from '@nestjs/testing';
import { DonorsService } from './donors.service';
import { UsersService } from '../../auth/services/users.service';
import { BloodsService } from './bloods.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Donor } from '../entities/donor.entity';
import { NotFoundException } from '@nestjs/common';

describe('DonorsService', () => {
  let donorsService: DonorsService;
  let usersService: UsersService;
  let bloodsService: BloodsService;
  let donorRepository: Repository<Donor>;

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
    type: 'O+',
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
  ];

  const mockCreateDonorDto = {
    document: '111222333',
    name: 'Alice',
    lastname: 'Johnson',
    birthDate: new Date('1995-03-20'),
    userId: 3,
    bloodId: 1,
  };

  const mockUpdateDonorDto = {
    name: 'UpdatedName',
    lastname: 'UpdatedLastname',
  };

  // Mock functions
  const mockUsersFindOne = jest.fn();
  const mockUsersCheckUserProfiles = jest.fn();
  const mockUsersRemove = jest.fn();
  const mockBloodsFindOne = jest.fn();
  const mockDonorCreate = jest.fn();
  const mockDonorSave = jest.fn();
  const mockDonorFind = jest.fn();
  const mockDonorFindOne = jest.fn();
  const mockDonorUpdate = jest.fn();
  const mockDonorDelete = jest.fn();

  const mockUsersService = {
    findOne: mockUsersFindOne,
    checkUserProfiles: mockUsersCheckUserProfiles,
    remove: mockUsersRemove,
  };

  const mockBloodsService = {
    findOne: mockBloodsFindOne,
  };

  const mockDonorRepository = {
    create: mockDonorCreate,
    save: mockDonorSave,
    find: mockDonorFind,
    findOne: mockDonorFindOne,
    update: mockDonorUpdate,
    delete: mockDonorDelete,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DonorsService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: BloodsService,
          useValue: mockBloodsService,
        },
        {
          provide: getRepositoryToken(Donor),
          useValue: mockDonorRepository,
        },
      ],
    }).compile();

    donorsService = module.get<DonorsService>(DonorsService);
    usersService = module.get<UsersService>(UsersService);
    bloodsService = module.get<BloodsService>(BloodsService);
    donorRepository = module.get<Repository<Donor>>(getRepositoryToken(Donor));

    // Limpiar mocks antes de cada test
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new donor successfully', async () => {
      // Arrange
      const newDonor = {
        id: 3,
        ...mockCreateDonorDto,
        user: mockUser,
        blood: mockBlood,
      };

      mockUsersFindOne.mockResolvedValue(mockUser);
      mockBloodsFindOne.mockResolvedValue(mockBlood);
      mockUsersCheckUserProfiles.mockResolvedValue({
        hasDonor: false,
        hasHealthEntity: false,
        hasAnyProfile: false,
      });
      mockDonorCreate.mockReturnValue(newDonor);
      mockDonorSave.mockResolvedValue(newDonor);

      // Act
      const result = await donorsService.create(mockCreateDonorDto);

      // Assert
      expect(mockUsersFindOne).toHaveBeenCalledWith(mockCreateDonorDto.userId);
      expect(mockBloodsFindOne).toHaveBeenCalledWith(mockCreateDonorDto.bloodId);
      expect(mockUsersCheckUserProfiles).toHaveBeenCalledWith(mockUser.id);
      expect(mockDonorCreate).toHaveBeenCalledWith({
        ...mockCreateDonorDto,
        user: mockUser,
        blood: mockBlood,
      });
      expect(mockDonorSave).toHaveBeenCalledWith(newDonor);
      expect(result).toEqual(newDonor);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      // Arrange
      mockUsersFindOne.mockResolvedValue(null);
      mockBloodsFindOne.mockResolvedValue(mockBlood);

      // Act & Assert
      await expect(donorsService.create(mockCreateDonorDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(donorsService.create(mockCreateDonorDto)).rejects.toThrow(
        'User not found',
      );
      expect(mockUsersFindOne).toHaveBeenCalledWith(mockCreateDonorDto.userId);
      expect(mockBloodsFindOne).toHaveBeenCalledWith(mockCreateDonorDto.bloodId);
      expect(mockDonorSave).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when blood type does not exist', async () => {
      // Arrange
      mockUsersFindOne.mockResolvedValue(mockUser);
      mockBloodsFindOne.mockResolvedValue(null);

      // Act & Assert
      await expect(donorsService.create(mockCreateDonorDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(donorsService.create(mockCreateDonorDto)).rejects.toThrow(
        'Blood type not found',
      );
      expect(mockUsersFindOne).toHaveBeenCalledWith(mockCreateDonorDto.userId);
      expect(mockBloodsFindOne).toHaveBeenCalledWith(mockCreateDonorDto.bloodId);
      expect(mockDonorSave).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when user already has a donor profile', async () => {
      // Arrange
      mockUsersFindOne.mockResolvedValue(mockUser);
      mockBloodsFindOne.mockResolvedValue(mockBlood);
      mockUsersCheckUserProfiles.mockResolvedValue({
        hasDonor: true,
        hasHealthEntity: false,
        hasAnyProfile: true,
      });

      // Act & Assert
      await expect(donorsService.create(mockCreateDonorDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(donorsService.create(mockCreateDonorDto)).rejects.toThrow(
        'User already has a donor profile',
      );
      expect(mockUsersCheckUserProfiles).toHaveBeenCalledWith(mockUser.id);
      expect(mockDonorSave).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when user already has any profile (donor or health entity)', async () => {
      // Arrange
      mockUsersFindOne.mockResolvedValue(mockUser);
      mockBloodsFindOne.mockResolvedValue(mockBlood);
      mockUsersCheckUserProfiles.mockResolvedValue({
        hasDonor: false,
        hasHealthEntity: true,
        hasAnyProfile: true,
      });

      // Act & Assert
      await expect(donorsService.create(mockCreateDonorDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(donorsService.create(mockCreateDonorDto)).rejects.toThrow(
        'User already has a donor profile',
      );
      expect(mockUsersCheckUserProfiles).toHaveBeenCalledWith(mockUser.id);
      expect(mockDonorSave).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all donors', async () => {
      // Arrange
      mockDonorFind.mockResolvedValue(mockDonors);

      // Act
      const result = await donorsService.findAll();

      // Assert
      expect(mockDonorFind).toHaveBeenCalled();
      expect(result).toEqual(mockDonors);
      expect(result).toHaveLength(2);
    });

    it('should throw NotFoundException when no donors are found', async () => {
      // Arrange
      mockDonorFind.mockResolvedValue([]);

      // Act & Assert
      await expect(donorsService.findAll()).rejects.toThrow(NotFoundException);
      await expect(donorsService.findAll()).rejects.toThrow('No users found');
      expect(mockDonorFind).toHaveBeenCalled();
    });

    it('should throw NotFoundException when donors is null', async () => {
      // Arrange
      mockDonorFind.mockResolvedValue(null);

      // Act & Assert
      await expect(donorsService.findAll()).rejects.toThrow(NotFoundException);
      await expect(donorsService.findAll()).rejects.toThrow('No users found');
    });
  });

  describe('findOne', () => {
    it('should return a donor by id', async () => {
      // Arrange
      const donorId = 1;
      mockDonorFindOne.mockResolvedValue(mockDonor);

      // Act
      const result = await donorsService.findOne(donorId);

      // Assert
      expect(mockDonorFindOne).toHaveBeenCalledWith({ where: { id: donorId } });
      expect(result).toEqual(mockDonor);
    });

    it('should throw NotFoundException when donor is not found', async () => {
      // Arrange
      const donorId = 999;
      mockDonorFindOne.mockResolvedValue(null);

      // Act & Assert
      await expect(donorsService.findOne(donorId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(donorsService.findOne(donorId)).rejects.toThrow(
        'Donor not found',
      );
      expect(mockDonorFindOne).toHaveBeenCalledWith({ where: { id: donorId } });
    });
  });

  describe('update', () => {
    it('should update a donor successfully', async () => {
      // Arrange
      const donorId = 1;
      const updatedDonor = { ...mockDonor, ...mockUpdateDonorDto };
      mockDonorUpdate.mockResolvedValue({ affected: 1 });
      mockDonorFindOne.mockResolvedValue(updatedDonor);

      // Act
      const result = await donorsService.update(donorId, mockUpdateDonorDto);

      // Assert
      expect(mockDonorUpdate).toHaveBeenCalledWith(donorId, mockUpdateDonorDto);
      expect(mockDonorFindOne).toHaveBeenCalledWith({ where: { id: donorId } });
      expect(result).toEqual(updatedDonor);
    });

    it('should throw NotFoundException when donor is not updated', async () => {
      // Arrange
      const donorId = 999;
      mockDonorUpdate.mockResolvedValue({ affected: 0 });

      // Act & Assert
      await expect(
        donorsService.update(donorId, mockUpdateDonorDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        donorsService.update(donorId, mockUpdateDonorDto),
      ).rejects.toThrow('Donor not updated');
      expect(mockDonorUpdate).toHaveBeenCalledWith(donorId, mockUpdateDonorDto);
      expect(mockDonorFindOne).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a donor and associated user successfully', async () => {
      // Arrange
      const donorId = 1;
      const userId = mockUser.id;
      mockDonorFindOne.mockResolvedValue(mockDonor);
      mockDonorDelete.mockResolvedValue({ affected: 1 });
      mockUsersRemove.mockResolvedValue(userId);

      // Act
      const result = await donorsService.remove(donorId);

      // Assert
      expect(mockDonorFindOne).toHaveBeenCalledWith({ where: { id: donorId } });
      expect(mockDonorDelete).toHaveBeenCalledWith(donorId);
      expect(mockUsersRemove).toHaveBeenCalledWith(userId);
      expect(result).toBe(donorId);
    });

    it('should throw NotFoundException when donor is not found', async () => {
      // Arrange
      const donorId = 999;
      mockDonorFindOne.mockResolvedValue(null);

      // Act & Assert
      await expect(donorsService.remove(donorId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(donorsService.remove(donorId)).rejects.toThrow(
        'Donor not found',
      );
      expect(mockDonorFindOne).toHaveBeenCalledWith({ where: { id: donorId } });
      expect(mockDonorDelete).not.toHaveBeenCalled();
      expect(mockUsersRemove).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when donor deletion fails', async () => {
      // Arrange
      const donorId = 1;
      mockDonorFindOne.mockResolvedValue(mockDonor);
      mockDonorDelete.mockResolvedValue({ affected: 0 });

      // Act & Assert
      await expect(donorsService.remove(donorId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(donorsService.remove(donorId)).rejects.toThrow(
        'Donor not deleted',
      );
      expect(mockDonorDelete).toHaveBeenCalledWith(donorId);
      expect(mockUsersRemove).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when user deletion fails', async () => {
      // Arrange
      const donorId = 1;
      const userId = mockUser.id;
      mockDonorFindOne.mockResolvedValue(mockDonor);
      mockDonorDelete.mockResolvedValue({ affected: 1 });
      mockUsersRemove.mockResolvedValue(null);

      // Act & Assert
      await expect(donorsService.remove(donorId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(donorsService.remove(donorId)).rejects.toThrow(
        'User not found',
      );
      expect(mockDonorDelete).toHaveBeenCalledWith(donorId);
      expect(mockUsersRemove).toHaveBeenCalledWith(userId);
    });
  });

  describe('Service Definition', () => {
    it('should be defined', () => {
      expect(donorsService).toBeDefined();
    });

    it('should have donorRepository injected', () => {
      expect(donorRepository).toBeDefined();
    });

    it('should have usersService injected', () => {
      expect(usersService).toBeDefined();
    });

    it('should have bloodsService injected', () => {
      expect(bloodsService).toBeDefined();
    });
  });
});
