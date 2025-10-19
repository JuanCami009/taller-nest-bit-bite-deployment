import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { BloodBagsService } from '../donations/services/blood-bags.service';
import { RequestsService } from '../donations/services/requests.service';
import { DonorsService } from '../donations/services/donors.service';
import { Type, Rh } from '../donations/entities/blood.entity';
import { InstitutionType } from '../donations/entities/health-entity.entity';
import { GroupBy } from './dtos/group-by.dto';

describe('ReportsService', () => {
  let reportsService: ReportsService;
  let bloodBagsService: BloodBagsService;
  let requestsService: RequestsService;
  let donorsService: DonorsService;

  // Mock data
  const mockBlood = {
    id: 1,
    type: Type.O,
    rh: Rh.POSITIVE,
  };

  const mockBloodA = {
    id: 2,
    type: Type.A,
    rh: Rh.NEGATIVE,
  };

  const mockDonor = {
    id: 1,
    document: '123456789',
    name: 'John',
    lastname: 'Doe',
    birthDate: new Date('1990-01-01'),
  };

  const mockDonor2 = {
    id: 2,
    document: '987654321',
    name: 'Jane',
    lastname: 'Smith',
    birthDate: new Date('1992-05-15'),
  };

  const mockHealthEntity = {
    id: 1,
    nit: '123456789',
    name: 'Hospital Central',
    institutionType: InstitutionType.HOSPITAL,
  };

  const mockHealthEntity2 = {
    id: 2,
    nit: '987654321',
    name: 'Clinic North',
    institutionType: InstitutionType.CLINIC,
  };

  const pastDate = new Date('2025-01-15');
  const recentDate = new Date('2025-10-10');
  const futureDate = new Date('2025-12-31');
  const overdueFutureDate = new Date('2025-10-20');

  const mockRequest1 = {
    id: 1,
    dateCreated: pastDate,
    quantityNeeded: 100,
    dueDate: futureDate,
    blood: mockBlood,
    healthEntity: mockHealthEntity,
  };

  const mockRequest2 = {
    id: 2,
    dateCreated: recentDate,
    quantityNeeded: 50,
    dueDate: overdueFutureDate,
    blood: mockBloodA,
    healthEntity: mockHealthEntity2,
  };

  const mockBloodBag1 = {
    id: 1,
    quantity: 450,
    donationDate: pastDate,
    expirationDate: futureDate,
    blood: mockBlood,
    donor: mockDonor,
    request: mockRequest1,
  };

  const mockBloodBag2 = {
    id: 2,
    quantity: 500,
    donationDate: recentDate,
    expirationDate: futureDate,
    blood: mockBloodA,
    donor: mockDonor2,
    request: mockRequest2,
  };

  const mockBloodBag3 = {
    id: 3,
    quantity: 450,
    donationDate: recentDate,
    expirationDate: futureDate,
    blood: mockBlood,
    donor: mockDonor,
    request: mockRequest1,
  };

  // Mock functions
  const mockBloodBagsFindAll = jest.fn();
  const mockRequestsFindAll = jest.fn();
  const mockDonorsFindAll = jest.fn();

  const mockBloodBagsService = {
    findAll: mockBloodBagsFindAll,
  };

  const mockRequestsService = {
    findAll: mockRequestsFindAll,
  };

  const mockDonorsService = {
    findAll: mockDonorsFindAll,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: BloodBagsService,
          useValue: mockBloodBagsService,
        },
        {
          provide: RequestsService,
          useValue: mockRequestsService,
        },
        {
          provide: DonorsService,
          useValue: mockDonorsService,
        },
      ],
    }).compile();

    reportsService = module.get<ReportsService>(ReportsService);
    bloodBagsService = module.get<BloodBagsService>(BloodBagsService);
    requestsService = module.get<RequestsService>(RequestsService);
    donorsService = module.get<DonorsService>(DonorsService);

    // Limpiar mocks antes de cada test
    jest.clearAllMocks();
  });

  describe('inventoryByBlood', () => {
    it('should return inventory grouped by blood type', async () => {
      // Arrange
      const timeRange = { from: undefined, to: undefined };
      const bloodFilter = { type: undefined, rh: undefined };
      mockBloodBagsFindAll.mockResolvedValue([
        mockBloodBag1,
        mockBloodBag2,
        mockBloodBag3,
      ]);

      // Act
      const result = await reportsService.inventoryByBlood(
        timeRange,
        bloodFilter,
      );

      // Assert
      expect(mockBloodBagsFindAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result?.[0]?.type).toBe(Type.A);
      expect(result?.[0]?.units).toBe(500);
      expect(result?.[0]?.bags).toBe(1);
      expect(result?.[1]?.type).toBe(Type.O);
      expect(result?.[1]?.units).toBe(900);
      expect(result?.[1]?.bags).toBe(2);
    });

    it('should filter inventory by blood type', async () => {
      // Arrange
      const timeRange = { from: undefined, to: undefined };
      const bloodFilter = { type: Type.O, rh: undefined };
      mockBloodBagsFindAll.mockResolvedValue([
        mockBloodBag1,
        mockBloodBag2,
        mockBloodBag3,
      ]);

      // Act
      const result = await reportsService.inventoryByBlood(
        timeRange,
        bloodFilter,
      );

      // Assert
      expect(result).toHaveLength(1);
      expect(result?.[0]?.type).toBe(Type.O);
      expect(result?.[0]?.units).toBe(900);
      expect(result?.[0]?.bags).toBe(2);
    });

    it('should filter inventory by time range', async () => {
      // Arrange
      const timeRange = {
        from: '2025-10-01',
        to: '2025-10-31',
      };
      const bloodFilter = { type: undefined, rh: undefined };
      mockBloodBagsFindAll.mockResolvedValue([
        mockBloodBag1,
        mockBloodBag2,
        mockBloodBag3,
      ]);

      // Act
      const result = await reportsService.inventoryByBlood(
        timeRange,
        bloodFilter,
      );

      // Assert
      expect(result).toHaveLength(2);
      expect(result?.[0]?.type).toBe(Type.A);
      expect(result?.[1]?.type).toBe(Type.O);
    });

    it('should filter inventory by Rh factor', async () => {
      // Arrange
      const timeRange = { from: undefined, to: undefined };
      const bloodFilter = { type: undefined, rh: Rh.NEGATIVE };
      mockBloodBagsFindAll.mockResolvedValue([
        mockBloodBag1,
        mockBloodBag2,
        mockBloodBag3,
      ]);

      // Act
      const result = await reportsService.inventoryByBlood(
        timeRange,
        bloodFilter,
      );

      // Assert
      expect(result).toHaveLength(1);
      expect(result?.[0]?.type).toBe(Type.A);
      expect(result?.[0]?.rh).toBe(Rh.NEGATIVE);
    });
  });

  describe('requestsFulfillment', () => {
    it('should return requests fulfillment with pagination', async () => {
      // Arrange
      const timeRange = { from: undefined, to: undefined };
      const pagination = { limit: 10, offset: 0 };
      mockRequestsFindAll.mockResolvedValue([mockRequest1, mockRequest2]);
      mockBloodBagsFindAll.mockResolvedValue([
        mockBloodBag1,
        mockBloodBag2,
        mockBloodBag3,
      ]);

      // Act
      const result = await reportsService.requestsFulfillment(
        timeRange,
        pagination,
      );

      // Assert
      expect(mockRequestsFindAll).toHaveBeenCalled();
      expect(mockBloodBagsFindAll).toHaveBeenCalled();
      expect(result?.total).toBe(2);
      expect(result?.items).toHaveLength(2);
      expect(result?.items?.[0]?.requestId).toBe(2);
      expect(result?.items?.[0]?.status).toBe('FULFILLED');
    });

    it('should calculate fulfillment percentages correctly', async () => {
      // Arrange
      const timeRange = { from: undefined, to: undefined };
      const pagination = { limit: 10, offset: 0 };
      mockRequestsFindAll.mockResolvedValue([mockRequest1]);
      mockBloodBagsFindAll.mockResolvedValue([mockBloodBag1, mockBloodBag3]);

      // Act
      const result = await reportsService.requestsFulfillment(
        timeRange,
        pagination,
      );

      // Assert
      expect(result?.items?.[0]?.needed).toBe(100);
      expect(result?.items?.[0]?.delivered).toBe(900);
      expect(result?.items?.[0]?.fulfillment).toBe(100);
      expect(result?.items?.[0]?.status).toBe('FULFILLED');
    });

    it('should handle partial fulfillment status', async () => {
      // Arrange
      const partialRequest = {
        id: 3,
        dateCreated: recentDate,
        quantityNeeded: 1000,
        dueDate: futureDate,
        blood: mockBlood,
        healthEntity: mockHealthEntity,
      };
      const partialBag = {
        ...mockBloodBag1,
        id: 10,
        request: partialRequest,
      };
      const timeRange = { from: undefined, to: undefined };
      const pagination = { limit: 10, offset: 0 };
      mockRequestsFindAll.mockResolvedValue([partialRequest]);
      mockBloodBagsFindAll.mockResolvedValue([partialBag]);

      // Act
      const result = await reportsService.requestsFulfillment(
        timeRange,
        pagination,
      );

      // Assert
      expect(result?.items?.[0]?.status).toBe('PARTIAL');
      expect(result?.items?.[0]?.fulfillment).toBe(45);
    });

    it('should apply pagination correctly', async () => {
      // Arrange
      const timeRange = { from: undefined, to: undefined };
      const pagination = { limit: 1, offset: 1 };
      mockRequestsFindAll.mockResolvedValue([mockRequest1, mockRequest2]);
      mockBloodBagsFindAll.mockResolvedValue([mockBloodBag1, mockBloodBag2]);

      // Act
      const result = await reportsService.requestsFulfillment(
        timeRange,
        pagination,
      );

      // Assert
      expect(result?.total).toBe(2);
      expect(result?.items).toHaveLength(1);
      expect(result?.limit).toBe(1);
      expect(result?.offset).toBe(1);
    });
  });

  describe('overdueRequests', () => {
    it('should return overdue requests', async () => {
      // Arrange
      const now = new Date('2025-10-19');
      const overdueRequest = {
        id: 3,
        dateCreated: pastDate,
        quantityNeeded: 100,
        dueDate: new Date('2025-10-15'),
        blood: mockBlood,
        healthEntity: mockHealthEntity,
      };
      mockRequestsFindAll.mockResolvedValue([overdueRequest, mockRequest1]);
      mockBloodBagsFindAll.mockResolvedValue([]);

      // Act
      const result = await reportsService.overdueRequests(now);

      // Assert
      expect(mockRequestsFindAll).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result?.[0]?.requestId).toBe(3);
      expect(result?.[0]?.status).toBe('OVERDUE');
      expect(result?.[0]?.shortage).toBe(100);
    });

    it('should calculate shortage correctly', async () => {
      // Arrange
      const now = new Date('2025-10-19');
      const overdueRequest = {
        id: 3,
        dateCreated: pastDate,
        quantityNeeded: 1000,
        dueDate: new Date('2025-10-15'),
        blood: mockBlood,
        healthEntity: mockHealthEntity,
      };
      const overdueBag = {
        ...mockBloodBag1,
        id: 10,
        request: overdueRequest,
      };
      mockRequestsFindAll.mockResolvedValue([overdueRequest]);
      mockBloodBagsFindAll.mockResolvedValue([overdueBag]);

      // Act
      const result = await reportsService.overdueRequests(now);

      // Assert
      expect(result?.[0]?.needed).toBe(1000);
      expect(result?.[0]?.delivered).toBe(450);
      expect(result?.[0]?.shortage).toBe(550);
    });

    it('should exclude fulfilled late requests', async () => {
      // Arrange
      const now = new Date('2025-10-19');
      const overdueRequest = {
        id: 3,
        dateCreated: pastDate,
        quantityNeeded: 400,
        dueDate: new Date('2025-10-15'),
        blood: mockBlood,
        healthEntity: mockHealthEntity,
      };
      const fulfilledBag = {
        ...mockBloodBag1,
        id: 10,
        request: overdueRequest,
      };
      mockRequestsFindAll.mockResolvedValue([overdueRequest]);
      mockBloodBagsFindAll.mockResolvedValue([fulfilledBag]);

      // Act
      const result = await reportsService.overdueRequests(now);

      // Assert
      expect(result).toHaveLength(0);
    });

    it('should sort overdue requests by due date', async () => {
      // Arrange
      const now = new Date('2025-10-19');
      const overdueRequest1 = {
        id: 3,
        dateCreated: pastDate,
        quantityNeeded: 100,
        dueDate: new Date('2025-10-17'),
        blood: mockBlood,
        healthEntity: mockHealthEntity,
      };
      const overdueRequest2 = {
        id: 4,
        dateCreated: pastDate,
        quantityNeeded: 100,
        dueDate: new Date('2025-10-10'),
        blood: mockBlood,
        healthEntity: mockHealthEntity,
      };
      mockRequestsFindAll.mockResolvedValue([
        overdueRequest1,
        overdueRequest2,
      ]);
      mockBloodBagsFindAll.mockResolvedValue([]);

      // Act
      const result = await reportsService.overdueRequests(now);

      // Assert
      expect(result).toHaveLength(2);
      expect(result?.[0]?.requestId).toBe(4);
      expect(result?.[1]?.requestId).toBe(3);
    });
  });

  describe('donorsActivity', () => {
    it('should return donors activity report', async () => {
      // Arrange
      const timeRange = { from: undefined, to: undefined };
      mockDonorsFindAll.mockResolvedValue([mockDonor, mockDonor2]);
      mockBloodBagsFindAll.mockResolvedValue([
        mockBloodBag1,
        mockBloodBag2,
        mockBloodBag3,
      ]);

      // Act
      const result = await reportsService.donorsActivity(timeRange);

      // Assert
      expect(mockDonorsFindAll).toHaveBeenCalled();
      expect(mockBloodBagsFindAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result?.[0]?.donorId).toBe(1);
      expect(result?.[0]?.donations).toBe(2);
      expect(result?.[0]?.units).toBe(900);
    });

    it('should sort donors by units donated (descending)', async () => {
      // Arrange
      const timeRange = { from: undefined, to: undefined };
      mockDonorsFindAll.mockResolvedValue([mockDonor, mockDonor2]);
      mockBloodBagsFindAll.mockResolvedValue([
        mockBloodBag1,
        mockBloodBag2,
        mockBloodBag3,
      ]);

      // Act
      const result = await reportsService.donorsActivity(timeRange);

      // Assert
      expect(result?.[0]?.units).toBeGreaterThanOrEqual(result?.[1]?.units || 0);
    });

    it('should filter by time range', async () => {
      // Arrange
      const timeRange = { from: '2025-10-01', to: '2025-10-31' };
      mockDonorsFindAll.mockResolvedValue([mockDonor, mockDonor2]);
      mockBloodBagsFindAll.mockResolvedValue([
        mockBloodBag1,
        mockBloodBag2,
        mockBloodBag3,
      ]);

      // Act
      const result = await reportsService.donorsActivity(timeRange);

      // Assert
      expect(result?.[0]?.donations).toBe(1);
      expect(result?.[1]?.donations).toBe(1);
    });

    it('should include donors with zero donations', async () => {
      // Arrange
      const timeRange = { from: undefined, to: undefined };
      const donor3 = {
        id: 3,
        document: '111222333',
        name: 'Bob',
        lastname: 'Johnson',
        birthDate: new Date('1988-08-20'),
      };
      mockDonorsFindAll.mockResolvedValue([mockDonor, mockDonor2, donor3]);
      mockBloodBagsFindAll.mockResolvedValue([mockBloodBag1]);

      // Act
      const result = await reportsService.donorsActivity(timeRange);

      // Assert
      expect(result).toHaveLength(3);
      expect(result?.[2]?.donations).toBe(0);
      expect(result?.[2]?.units).toBe(0);
    });
  });

  describe('healthEntitiesSummary', () => {
    it('should return health entities summary', async () => {
      // Arrange
      const timeRange = { from: undefined, to: undefined };
      mockRequestsFindAll.mockResolvedValue([mockRequest1, mockRequest2]);
      mockBloodBagsFindAll.mockResolvedValue([
        mockBloodBag1,
        mockBloodBag2,
        mockBloodBag3,
      ]);

      // Act
      const result = await reportsService.healthEntitiesSummary(timeRange);

      // Assert
      expect(mockRequestsFindAll).toHaveBeenCalled();
      expect(mockBloodBagsFindAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result?.[0]?.healthEntityId).toBe(1);
      expect(result?.[0]?.requests).toBe(1);
    });

    it('should calculate fulfillment percentage correctly', async () => {
      // Arrange
      const timeRange = { from: undefined, to: undefined };
      mockRequestsFindAll.mockResolvedValue([mockRequest1]);
      mockBloodBagsFindAll.mockResolvedValue([mockBloodBag1, mockBloodBag3]);

      // Act
      const result = await reportsService.healthEntitiesSummary(timeRange);

      // Assert
      expect(result?.[0]?.unitsRequested).toBe(100);
      expect(result?.[0]?.unitsReceived).toBe(900);
      expect(result?.[0]?.fulfillmentPct).toBe(100);
    });

    it('should sort by fulfillment percentage (ascending)', async () => {
      // Arrange
      const timeRange = { from: undefined, to: undefined };
      mockRequestsFindAll.mockResolvedValue([mockRequest1, mockRequest2]);
      mockBloodBagsFindAll.mockResolvedValue([mockBloodBag2]);

      // Act
      const result = await reportsService.healthEntitiesSummary(timeRange);

      // Assert
      expect(result?.[0]?.fulfillmentPct).toBeLessThanOrEqual(
        result?.[1]?.fulfillmentPct || 100,
      );
    });

    it('should handle entities with no bags received', async () => {
      // Arrange
      const timeRange = { from: undefined, to: undefined };
      mockRequestsFindAll.mockResolvedValue([mockRequest1, mockRequest2]);
      mockBloodBagsFindAll.mockResolvedValue([]);

      // Act
      const result = await reportsService.healthEntitiesSummary(timeRange);

      // Assert
      expect(result).toHaveLength(2);
      expect(result?.[0]?.bagsReceived).toBe(0);
      expect(result?.[0]?.unitsReceived).toBe(0);
      expect(result?.[0]?.fulfillmentPct).toBe(0);
    });
  });

  describe('donationsByBlood', () => {
    it('should return donations grouped by blood type without grouping', async () => {
      // Arrange
      const timeRange = { from: undefined, to: undefined };
      const groupBy = { groupBy: GroupBy.NONE };
      mockBloodBagsFindAll.mockResolvedValue([
        mockBloodBag1,
        mockBloodBag2,
        mockBloodBag3,
      ]);

      // Act
      const result = await reportsService.donationsByBlood(timeRange, groupBy);

      // Assert
      expect(mockBloodBagsFindAll).toHaveBeenCalled();
      expect(Array.isArray(result)).toBe(true);
      if (Array.isArray(result) && 'type' in (result[0] || {})) {
        expect(result).toHaveLength(2);
        const items = result as Array<{
          type: Type;
          rh: Rh;
          donations: number;
          units: number;
        }>;
        expect(items[0]?.type).toBe(Type.A);
        expect(items[1]?.type).toBe(Type.O);
      }
    });

    it('should group donations by day', async () => {
      // Arrange
      const timeRange = { from: undefined, to: undefined };
      const groupBy = { groupBy: GroupBy.DAY };
      mockBloodBagsFindAll.mockResolvedValue([
        mockBloodBag1,
        mockBloodBag2,
        mockBloodBag3,
      ]);

      // Act
      const result = await reportsService.donationsByBlood(timeRange, groupBy);

      // Assert
      expect(Array.isArray(result)).toBe(true);
      if (Array.isArray(result) && 'period' in (result[0] || {})) {
        const grouped = result as Array<{
          period: string;
          items: Array<{ type: Type; rh: Rh; donations: number; units: number }>;
        }>;
        expect(grouped).toHaveLength(2);
        expect(grouped[0]).toHaveProperty('period');
        expect(grouped[0]).toHaveProperty('items');
      }
    });

    it('should group donations by month', async () => {
      // Arrange
      const timeRange = { from: undefined, to: undefined };
      const groupBy = { groupBy: GroupBy.MONTH };
      mockBloodBagsFindAll.mockResolvedValue([
        mockBloodBag1,
        mockBloodBag2,
        mockBloodBag3,
      ]);

      // Act
      const result = await reportsService.donationsByBlood(timeRange, groupBy);

      // Assert
      expect(Array.isArray(result)).toBe(true);
      if (Array.isArray(result) && 'period' in (result[0] || {})) {
        const grouped = result as Array<{
          period: string;
          items: Array<{ type: Type; rh: Rh; donations: number; units: number }>;
        }>;
        expect(grouped[0]?.period).toMatch(/^\d{4}-\d{2}$/);
      }
    });

    it('should calculate totals correctly in grouped results', async () => {
      // Arrange
      const timeRange = { from: undefined, to: undefined };
      const groupBy = { groupBy: GroupBy.NONE };
      mockBloodBagsFindAll.mockResolvedValue([
        mockBloodBag1,
        mockBloodBag2,
        mockBloodBag3,
      ]);

      // Act
      const result = await reportsService.donationsByBlood(timeRange, groupBy);

      // Assert
      if (Array.isArray(result) && 'type' in (result[0] || {})) {
        const items = result as Array<{
          type: Type;
          rh: Rh;
          donations: number;
          units: number;
        }>;
        const oPositive = items.find(
          (r) => r.type === Type.O && r.rh === Rh.POSITIVE,
        );
        expect(oPositive?.donations).toBe(2);
        expect(oPositive?.units).toBe(900);
      }
    });
  });

  describe('Service Definition', () => {
    it('should be defined', () => {
      expect(reportsService).toBeDefined();
    });

    it('should have bloodBagsService injected', () => {
      expect(bloodBagsService).toBeDefined();
    });

    it('should have requestsService injected', () => {
      expect(requestsService).toBeDefined();
    });

    it('should have donorsService injected', () => {
      expect(donorsService).toBeDefined();
    });
  });
});
