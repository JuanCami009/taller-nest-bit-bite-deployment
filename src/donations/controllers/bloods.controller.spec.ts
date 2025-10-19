import { Test, TestingModule } from '@nestjs/testing';
import { BloodsController } from './bloods.controller';
import { BloodsService } from '../services/bloods.service';
import { Type, Rh } from '../entities/blood.entity';

describe('BloodsController', () => {
  let bloodsController: BloodsController;
  let bloodsService: BloodsService;

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
    {
      id: 5,
      type: Type.O,
      rh: Rh.NEGATIVE,
      donors: [],
      bloodBags: [],
      requests: [],
    },
    {
      id: 6,
      type: Type.A,
      rh: Rh.POSITIVE,
      donors: [],
      bloodBags: [],
      requests: [],
    },
    {
      id: 7,
      type: Type.B,
      rh: Rh.NEGATIVE,
      donors: [],
      bloodBags: [],
      requests: [],
    },
    {
      id: 8,
      type: Type.AB,
      rh: Rh.POSITIVE,
      donors: [],
      bloodBags: [],
      requests: [],
    },
  ];

  // Mock functions
  const mockServiceFindAll = jest.fn();
  const mockServiceFindOne = jest.fn();

  const mockBloodsService = {
    findAll: mockServiceFindAll,
    findOne: mockServiceFindOne,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BloodsController],
      providers: [
        {
          provide: BloodsService,
          useValue: mockBloodsService,
        },
      ],
    }).compile();

    bloodsController = module.get<BloodsController>(BloodsController);
    bloodsService = module.get<BloodsService>(BloodsService);

    // Limpiar mocks antes de cada test
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all blood types', async () => {
      // Arrange
      mockServiceFindAll.mockResolvedValue(mockBloods);

      // Act
      const result = await bloodsController.findAll();

      // Assert
      expect(mockServiceFindAll).toHaveBeenCalled();
      expect(mockServiceFindAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockBloods);
      expect(result).toHaveLength(8);
    });

    it('should return all 8 possible blood type combinations', async () => {
      // Arrange
      mockServiceFindAll.mockResolvedValue(mockBloods);

      // Act
      const result = await bloodsController.findAll();

      // Assert
      expect(result).toHaveLength(8);
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: Type.O, rh: Rh.POSITIVE }),
          expect.objectContaining({ type: Type.A, rh: Rh.NEGATIVE }),
          expect.objectContaining({ type: Type.B, rh: Rh.POSITIVE }),
          expect.objectContaining({ type: Type.AB, rh: Rh.NEGATIVE }),
          expect.objectContaining({ type: Type.O, rh: Rh.NEGATIVE }),
          expect.objectContaining({ type: Type.A, rh: Rh.POSITIVE }),
          expect.objectContaining({ type: Type.B, rh: Rh.NEGATIVE }),
          expect.objectContaining({ type: Type.AB, rh: Rh.POSITIVE }),
        ]),
      );
    });

    it('should return blood types with positive and negative Rh factors', async () => {
      // Arrange
      mockServiceFindAll.mockResolvedValue(mockBloods);

      // Act
      const result = await bloodsController.findAll();

      // Assert
      const positiveRh = result?.filter((blood) => blood.rh === Rh.POSITIVE);
      const negativeRh = result?.filter((blood) => blood.rh === Rh.NEGATIVE);
      expect(positiveRh).toHaveLength(4);
      expect(negativeRh).toHaveLength(4);
    });

    it('should call service without parameters', async () => {
      // Arrange
      mockServiceFindAll.mockResolvedValue(mockBloods);

      // Act
      await bloodsController.findAll();

      // Assert
      expect(mockServiceFindAll).toHaveBeenCalledWith();
    });
  });

  describe('findOne', () => {
    it('should return a blood type by id', async () => {
      // Arrange
      const bloodId = 1;
      mockServiceFindOne.mockResolvedValue(mockBlood);

      // Act
      const result = await bloodsController.findOne(bloodId);

      // Assert
      expect(mockServiceFindOne).toHaveBeenCalledWith(bloodId);
      expect(mockServiceFindOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockBlood);
    });

    it('should return O+ blood type', async () => {
      // Arrange
      const bloodId = 1;
      mockServiceFindOne.mockResolvedValue(mockBloods[0]);

      // Act
      const result = await bloodsController.findOne(bloodId);

      // Assert
      expect(mockServiceFindOne).toHaveBeenCalledWith(bloodId);
      expect(result?.type).toBe(Type.O);
      expect(result?.rh).toBe(Rh.POSITIVE);
    });

    it('should return A- blood type', async () => {
      // Arrange
      const bloodId = 2;
      mockServiceFindOne.mockResolvedValue(mockBloods[1]);

      // Act
      const result = await bloodsController.findOne(bloodId);

      // Assert
      expect(mockServiceFindOne).toHaveBeenCalledWith(bloodId);
      expect(result?.type).toBe(Type.A);
      expect(result?.rh).toBe(Rh.NEGATIVE);
    });

    it('should return AB+ blood type (universal recipient)', async () => {
      // Arrange
      const bloodId = 8;
      mockServiceFindOne.mockResolvedValue(mockBloods[7]);

      // Act
      const result = await bloodsController.findOne(bloodId);

      // Assert
      expect(mockServiceFindOne).toHaveBeenCalledWith(bloodId);
      expect(result?.type).toBe(Type.AB);
      expect(result?.rh).toBe(Rh.POSITIVE);
      expect(result?.id).toBe(8);
    });

    it('should return O- blood type (universal donor)', async () => {
      // Arrange
      const bloodId = 5;
      mockServiceFindOne.mockResolvedValue(mockBloods[4]);

      // Act
      const result = await bloodsController.findOne(bloodId);

      // Assert
      expect(mockServiceFindOne).toHaveBeenCalledWith(bloodId);
      expect(result?.type).toBe(Type.O);
      expect(result?.rh).toBe(Rh.NEGATIVE);
      expect(result?.id).toBe(5);
    });

    it('should use ParseIntPipe for id parameter', async () => {
      // Arrange
      const bloodId = 3;
      mockServiceFindOne.mockResolvedValue(mockBloods[2]);

      // Act
      const result = await bloodsController.findOne(bloodId);

      // Assert
      expect(mockServiceFindOne).toHaveBeenCalledWith(bloodId);
      expect(typeof bloodId).toBe('number');
      expect(result?.id).toBe(3);
    });

    it('should handle different blood ids', async () => {
      // Arrange
      const bloodId = 6;
      mockServiceFindOne.mockResolvedValue(mockBloods[5]);

      // Act
      const result = await bloodsController.findOne(bloodId);

      // Assert
      expect(mockServiceFindOne).toHaveBeenCalledWith(bloodId);
      expect(result?.type).toBe(Type.A);
      expect(result?.rh).toBe(Rh.POSITIVE);
    });
  });

  describe('Controller Definition', () => {
    it('should be defined', () => {
      expect(bloodsController).toBeDefined();
    });

    it('should have bloodsService injected', () => {
      expect(bloodsService).toBeDefined();
    });
  });
});
