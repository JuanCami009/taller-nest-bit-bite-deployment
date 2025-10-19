import { Test, TestingModule } from '@nestjs/testing';
import { BloodsService } from './bloods.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Blood, Type, Rh } from '../entities/blood.entity';
import { NotFoundException } from '@nestjs/common';

describe('BloodsService', () => {
  let bloodsService: BloodsService;
  let bloodRepository: Repository<Blood>;

  // Mock data
  const mockBlood = {
    id: 1,
    type: Type.O,
    rh: Rh.POSITIVE,
    donors: [],
    bloodBags: [],
    requests: [],
  };

  const mockBloods = [
    mockBlood,
    {
      id: 2,
      type: Type.A,
      rh: Rh.NEGATIVE,
      donors: [],
      bloodBags: [],
      requests: [],
    },
    {
      id: 3,
      type: Type.B,
      rh: Rh.POSITIVE,
      donors: [],
      bloodBags: [],
      requests: [],
    },
    {
      id: 4,
      type: Type.AB,
      rh: Rh.NEGATIVE,
      donors: [],
      bloodBags: [],
      requests: [],
    },
  ];

  // Mock functions
  const mockBloodFind = jest.fn();
  const mockBloodFindOne = jest.fn();

  const mockBloodRepository = {
    find: mockBloodFind,
    findOne: mockBloodFindOne,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BloodsService,
        {
          provide: getRepositoryToken(Blood),
          useValue: mockBloodRepository,
        },
      ],
    }).compile();

    bloodsService = module.get<BloodsService>(BloodsService);
    bloodRepository = module.get<Repository<Blood>>(getRepositoryToken(Blood));

    // Limpiar mocks antes de cada test
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all blood types', async () => {
      // Arrange
      mockBloodFind.mockResolvedValue(mockBloods);

      // Act
      const result = await bloodsService.findAll();

      // Assert
      expect(mockBloodFind).toHaveBeenCalled();
      expect(result).toEqual(mockBloods);
      expect(result).toHaveLength(4);
    });

    it('should return all blood types with different combinations', async () => {
      // Arrange
      mockBloodFind.mockResolvedValue(mockBloods);

      // Act
      const result = await bloodsService.findAll();

      // Assert
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: Type.O, rh: Rh.POSITIVE }),
          expect.objectContaining({ type: Type.A, rh: Rh.NEGATIVE }),
          expect.objectContaining({ type: Type.B, rh: Rh.POSITIVE }),
          expect.objectContaining({ type: Type.AB, rh: Rh.NEGATIVE }),
        ]),
      );
    });

    it('should throw NotFoundException when no blood types are found', async () => {
      // Arrange
      mockBloodFind.mockResolvedValue([]);

      // Act & Assert
      await expect(bloodsService.findAll()).rejects.toThrow(NotFoundException);
      await expect(bloodsService.findAll()).rejects.toThrow(
        'No blood types found',
      );
      expect(mockBloodFind).toHaveBeenCalled();
    });

    it('should throw NotFoundException when blood types is null', async () => {
      // Arrange
      mockBloodFind.mockResolvedValue(null);

      // Act & Assert
      await expect(bloodsService.findAll()).rejects.toThrow(NotFoundException);
      await expect(bloodsService.findAll()).rejects.toThrow(
        'No blood types found',
      );
    });
  });

  describe('findOne', () => {
    it('should return a blood type by id', async () => {
      // Arrange
      const bloodId = 1;
      mockBloodFindOne.mockResolvedValue(mockBlood);

      // Act
      const result = await bloodsService.findOne(bloodId);

      // Assert
      expect(mockBloodFindOne).toHaveBeenCalledWith({ where: { id: bloodId } });
      expect(result).toEqual(mockBlood);
    });

    it('should return O+ blood type', async () => {
      // Arrange
      const bloodId = 1;
      mockBloodFindOne.mockResolvedValue(mockBlood);

      // Act
      const result = await bloodsService.findOne(bloodId);

      // Assert
      expect(result?.type).toBe(Type.O);
      expect(result?.rh).toBe(Rh.POSITIVE);
    });

    it('should return A- blood type', async () => {
      // Arrange
      const bloodId = 2;
      const bloodANegative = mockBloods[1];
      mockBloodFindOne.mockResolvedValue(bloodANegative);

      // Act
      const result = await bloodsService.findOne(bloodId);

      // Assert
      expect(result?.type).toBe(Type.A);
      expect(result?.rh).toBe(Rh.NEGATIVE);
    });

    it('should throw NotFoundException when blood type is not found', async () => {
      // Arrange
      const bloodId = 999;
      mockBloodFindOne.mockResolvedValue(null);

      // Act & Assert
      await expect(bloodsService.findOne(bloodId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(bloodsService.findOne(bloodId)).rejects.toThrow(
        'Blood type not found',
      );
      expect(mockBloodFindOne).toHaveBeenCalledWith({ where: { id: bloodId } });
    });

    it('should handle multiple calls with different ids', async () => {
      // Arrange
      mockBloodFindOne
        .mockResolvedValueOnce(mockBloods[0])
        .mockResolvedValueOnce(mockBloods[1])
        .mockResolvedValueOnce(mockBloods[2]);

      // Act
      const result1 = await bloodsService.findOne(1);
      const result2 = await bloodsService.findOne(2);
      const result3 = await bloodsService.findOne(3);

      // Assert
      expect(result1?.type).toBe(Type.O);
      expect(result2?.type).toBe(Type.A);
      expect(result3?.type).toBe(Type.B);
      expect(mockBloodFindOne).toHaveBeenCalledTimes(3);
    });
  });

  describe('Service Definition', () => {
    it('should be defined', () => {
      expect(bloodsService).toBeDefined();
    });

    it('should have bloodRepository injected', () => {
      expect(bloodRepository).toBeDefined();
    });
  });
});
