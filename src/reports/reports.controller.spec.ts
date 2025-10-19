import { Test, TestingModule } from '@nestjs/testing';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Type, Rh } from '../donations/entities/blood.entity';
import { GroupBy } from './dtos/group-by.dto';

describe('ReportsController', () => {
  let reportsController: ReportsController;
  let reportsService: ReportsService;

  // Mock data
  const mockInventoryResult = [
    { type: Type.O, rh: Rh.POSITIVE, units: 1500, bags: 3 },
    { type: Type.A, rh: Rh.NEGATIVE, units: 800, bags: 2 },
  ];

  const mockFulfillmentResult = {
    total: 10,
    limit: 5,
    offset: 0,
    items: [
      {
        requestId: 1,
        blood: 'O+',
        healthEntityId: 1,
        createdAt: new Date('2025-01-15'),
        dueDate: new Date('2025-12-31'),
        needed: 100,
        delivered: 100,
        fulfillment: 100,
        status: 'FULFILLED',
      },
      {
        requestId: 2,
        blood: 'A-',
        healthEntityId: 2,
        createdAt: new Date('2025-10-10'),
        dueDate: new Date('2025-11-30'),
        needed: 50,
        delivered: 25,
        fulfillment: 50,
        status: 'PARTIAL',
      },
    ],
  };

  const mockOverdueResult = [
    {
      requestId: 3,
      healthEntity: 'Hospital Central',
      blood: 'AB+',
      dueDate: new Date('2025-10-10'),
      needed: 200,
      delivered: 50,
      shortage: 150,
      status: 'OVERDUE',
    },
  ];

  const mockDonorsActivityResult = [
    {
      donorId: 1,
      name: 'John',
      document: '123456789',
      donations: 5,
      units: 2250,
    },
    {
      donorId: 2,
      name: 'Jane',
      document: '987654321',
      donations: 3,
      units: 1350,
    },
  ];

  const mockHealthEntitiesResult = [
    {
      healthEntityId: 1,
      name: 'Hospital Central',
      requests: 10,
      unitsRequested: 1000,
      bagsReceived: 8,
      unitsReceived: 800,
      fulfillmentPct: 80,
    },
    {
      healthEntityId: 2,
      name: 'Clinic North',
      requests: 5,
      unitsRequested: 500,
      bagsReceived: 5,
      unitsReceived: 500,
      fulfillmentPct: 100,
    },
  ];

  const mockDonationsByBloodResult = [
    { type: Type.O, rh: Rh.POSITIVE, donations: 10, units: 4500 },
    { type: Type.A, rh: Rh.NEGATIVE, donations: 5, units: 2250 },
  ];

  const mockDonationsByBloodGroupedResult = [
    {
      period: '2025-01',
      items: [
        { type: Type.O, rh: Rh.POSITIVE, donations: 5, units: 2250 },
        { type: Type.A, rh: Rh.NEGATIVE, donations: 2, units: 900 },
      ],
    },
    {
      period: '2025-02',
      items: [
        { type: Type.O, rh: Rh.POSITIVE, donations: 5, units: 2250 },
        { type: Type.A, rh: Rh.NEGATIVE, donations: 3, units: 1350 },
      ],
    },
  ];

  // Mock functions
  const mockInventoryByBlood = jest.fn();
  const mockRequestsFulfillment = jest.fn();
  const mockOverdueRequests = jest.fn();
  const mockDonorsActivity = jest.fn();
  const mockHealthEntitiesSummary = jest.fn();
  const mockDonationsByBlood = jest.fn();

  const mockReportsService = {
    inventoryByBlood: mockInventoryByBlood,
    requestsFulfillment: mockRequestsFulfillment,
    overdueRequests: mockOverdueRequests,
    donorsActivity: mockDonorsActivity,
    healthEntitiesSummary: mockHealthEntitiesSummary,
    donationsByBlood: mockDonationsByBlood,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        {
          provide: ReportsService,
          useValue: mockReportsService,
        },
      ],
    }).compile();

    reportsController = module.get<ReportsController>(ReportsController);
    reportsService = module.get<ReportsService>(ReportsService);

    // Limpiar mocks antes de cada test
    jest.clearAllMocks();
  });

  describe('inventory', () => {
    it('should return inventory report without filters', async () => {
      // Arrange
      const timeRange = { from: undefined, to: undefined };
      const bloodFilter = { type: undefined, rh: undefined };
      mockInventoryByBlood.mockResolvedValue(mockInventoryResult);

      // Act
      const result = await reportsController.inventory(timeRange, bloodFilter);

      // Assert
      expect(mockInventoryByBlood).toHaveBeenCalledWith(
        timeRange,
        bloodFilter,
      );
      expect(result).toEqual(mockInventoryResult);
      expect(result).toHaveLength(2);
    });

    it('should return inventory report filtered by blood type', async () => {
      // Arrange
      const timeRange = { from: undefined, to: undefined };
      const bloodFilter = { type: Type.O, rh: undefined };
      const filteredResult = [mockInventoryResult[0]];
      mockInventoryByBlood.mockResolvedValue(filteredResult);

      // Act
      const result = await reportsController.inventory(timeRange, bloodFilter);

      // Assert
      expect(mockInventoryByBlood).toHaveBeenCalledWith(
        timeRange,
        bloodFilter,
      );
      expect(result).toEqual(filteredResult);
      expect(result).toHaveLength(1);
    });

    it('should return inventory report with time range filter', async () => {
      // Arrange
      const timeRange = { from: '2025-01-01', to: '2025-12-31' };
      const bloodFilter = { type: undefined, rh: undefined };
      mockInventoryByBlood.mockResolvedValue(mockInventoryResult);

      // Act
      const result = await reportsController.inventory(timeRange, bloodFilter);

      // Assert
      expect(mockInventoryByBlood).toHaveBeenCalledWith(
        timeRange,
        bloodFilter,
      );
      expect(result).toEqual(mockInventoryResult);
    });

    it('should return inventory report with combined filters', async () => {
      // Arrange
      const timeRange = { from: '2025-01-01', to: '2025-12-31' };
      const bloodFilter = { type: Type.O, rh: Rh.POSITIVE };
      const filteredResult = [mockInventoryResult[0]];
      mockInventoryByBlood.mockResolvedValue(filteredResult);

      // Act
      const result = await reportsController.inventory(timeRange, bloodFilter);

      // Assert
      expect(mockInventoryByBlood).toHaveBeenCalledWith(
        timeRange,
        bloodFilter,
      );
      expect(result).toEqual(filteredResult);
    });
  });

  describe('fulfillment', () => {
    it('should return requests fulfillment report with default pagination', async () => {
      // Arrange
      const timeRange = { from: undefined, to: undefined };
      const pagination = { limit: 10, offset: 0 };
      mockRequestsFulfillment.mockResolvedValue(mockFulfillmentResult);

      // Act
      const result = await reportsController.fulfillment(
        timeRange,
        pagination,
      );

      // Assert
      expect(mockRequestsFulfillment).toHaveBeenCalledWith(
        timeRange,
        pagination,
      );
      expect(result).toEqual(mockFulfillmentResult);
      expect(result?.total).toBe(10);
      expect(result?.items).toHaveLength(2);
    });

    it('should return requests fulfillment report with time range', async () => {
      // Arrange
      const timeRange = { from: '2025-01-01', to: '2025-12-31' };
      const pagination = { limit: 5, offset: 0 };
      mockRequestsFulfillment.mockResolvedValue(mockFulfillmentResult);

      // Act
      const result = await reportsController.fulfillment(
        timeRange,
        pagination,
      );

      // Assert
      expect(mockRequestsFulfillment).toHaveBeenCalledWith(
        timeRange,
        pagination,
      );
      expect(result).toEqual(mockFulfillmentResult);
    });

    it('should return requests fulfillment report with custom pagination', async () => {
      // Arrange
      const timeRange = { from: undefined, to: undefined };
      const pagination = { limit: 2, offset: 5 };
      const paginatedResult = {
        ...mockFulfillmentResult,
        limit: 2,
        offset: 5,
        items: [mockFulfillmentResult.items[0]],
      };
      mockRequestsFulfillment.mockResolvedValue(paginatedResult);

      // Act
      const result = await reportsController.fulfillment(
        timeRange,
        pagination,
      );

      // Assert
      expect(mockRequestsFulfillment).toHaveBeenCalledWith(
        timeRange,
        pagination,
      );
      expect(result?.limit).toBe(2);
      expect(result?.offset).toBe(5);
    });

    it('should return fulfillment report with different statuses', async () => {
      // Arrange
      const timeRange = { from: undefined, to: undefined };
      const pagination = { limit: 10, offset: 0 };
      mockRequestsFulfillment.mockResolvedValue(mockFulfillmentResult);

      // Act
      const result = await reportsController.fulfillment(
        timeRange,
        pagination,
      );

      // Assert
      expect(result?.items?.[0]?.status).toBe('FULFILLED');
      expect(result?.items?.[1]?.status).toBe('PARTIAL');
    });
  });

  describe('overdue', () => {
    it('should return overdue requests report', async () => {
      // Arrange
      mockOverdueRequests.mockResolvedValue(mockOverdueResult);

      // Act
      const result = await reportsController.overdue();

      // Assert
      expect(mockOverdueRequests).toHaveBeenCalled();
      expect(result).toEqual(mockOverdueResult);
      expect(result).toHaveLength(1);
    });

    it('should return overdue requests with shortage information', async () => {
      // Arrange
      mockOverdueRequests.mockResolvedValue(mockOverdueResult);

      // Act
      const result = await reportsController.overdue();

      // Assert
      expect(result?.[0]?.shortage).toBe(150);
      expect(result?.[0]?.status).toBe('OVERDUE');
    });

    it('should return empty array when no overdue requests', async () => {
      // Arrange
      mockOverdueRequests.mockResolvedValue([]);

      // Act
      const result = await reportsController.overdue();

      // Assert
      expect(mockOverdueRequests).toHaveBeenCalled();
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should return multiple overdue requests sorted by due date', async () => {
      // Arrange
      const multipleOverdue = [
        { ...mockOverdueResult[0], requestId: 1, dueDate: new Date('2025-10-01') },
        { ...mockOverdueResult[0], requestId: 2, dueDate: new Date('2025-10-05') },
        { ...mockOverdueResult[0], requestId: 3, dueDate: new Date('2025-10-10') },
      ];
      mockOverdueRequests.mockResolvedValue(multipleOverdue);

      // Act
      const result = await reportsController.overdue();

      // Assert
      expect(result).toHaveLength(3);
      expect(result?.[0]?.requestId).toBe(1);
      expect(result?.[2]?.requestId).toBe(3);
    });
  });

  describe('donorsActivity', () => {
    it('should return donors activity report without time range', async () => {
      // Arrange
      const timeRange = { from: undefined, to: undefined };
      mockDonorsActivity.mockResolvedValue(mockDonorsActivityResult);

      // Act
      const result = await reportsController.donorsActivity(timeRange);

      // Assert
      expect(mockDonorsActivity).toHaveBeenCalledWith(timeRange);
      expect(result).toEqual(mockDonorsActivityResult);
      expect(result).toHaveLength(2);
    });

    it('should return donors activity report with time range', async () => {
      // Arrange
      const timeRange = { from: '2025-01-01', to: '2025-12-31' };
      mockDonorsActivity.mockResolvedValue(mockDonorsActivityResult);

      // Act
      const result = await reportsController.donorsActivity(timeRange);

      // Assert
      expect(mockDonorsActivity).toHaveBeenCalledWith(timeRange);
      expect(result).toEqual(mockDonorsActivityResult);
    });

    it('should return donors sorted by units donated', async () => {
      // Arrange
      const timeRange = { from: undefined, to: undefined };
      mockDonorsActivity.mockResolvedValue(mockDonorsActivityResult);

      // Act
      const result = await reportsController.donorsActivity(timeRange);

      // Assert
      expect(result?.[0]?.units).toBeGreaterThan(result?.[1]?.units || 0);
      expect(result?.[0]?.donations).toBe(5);
      expect(result?.[1]?.donations).toBe(3);
    });

    it('should return empty array when no donors have activity', async () => {
      // Arrange
      const timeRange = { from: '2025-01-01', to: '2025-01-31' };
      mockDonorsActivity.mockResolvedValue([]);

      // Act
      const result = await reportsController.donorsActivity(timeRange);

      // Assert
      expect(mockDonorsActivity).toHaveBeenCalledWith(timeRange);
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('healthEntities', () => {
    it('should return health entities summary without time range', async () => {
      // Arrange
      const timeRange = { from: undefined, to: undefined };
      mockHealthEntitiesSummary.mockResolvedValue(mockHealthEntitiesResult);

      // Act
      const result = await reportsController.healthEntities(timeRange);

      // Assert
      expect(mockHealthEntitiesSummary).toHaveBeenCalledWith(timeRange);
      expect(result).toEqual(mockHealthEntitiesResult);
      expect(result).toHaveLength(2);
    });

    it('should return health entities summary with time range', async () => {
      // Arrange
      const timeRange = { from: '2025-01-01', to: '2025-12-31' };
      mockHealthEntitiesSummary.mockResolvedValue(mockHealthEntitiesResult);

      // Act
      const result = await reportsController.healthEntities(timeRange);

      // Assert
      expect(mockHealthEntitiesSummary).toHaveBeenCalledWith(timeRange);
      expect(result).toEqual(mockHealthEntitiesResult);
    });

    it('should return health entities with fulfillment percentages', async () => {
      // Arrange
      const timeRange = { from: undefined, to: undefined };
      mockHealthEntitiesSummary.mockResolvedValue(mockHealthEntitiesResult);

      // Act
      const result = await reportsController.healthEntities(timeRange);

      // Assert
      expect(result?.[0]?.fulfillmentPct).toBe(80);
      expect(result?.[1]?.fulfillmentPct).toBe(100);
    });

    it('should return health entities sorted by fulfillment percentage', async () => {
      // Arrange
      const timeRange = { from: undefined, to: undefined };
      mockHealthEntitiesSummary.mockResolvedValue(mockHealthEntitiesResult);

      // Act
      const result = await reportsController.healthEntities(timeRange);

      // Assert
      expect(result?.[0]?.fulfillmentPct).toBeLessThanOrEqual(
        result?.[1]?.fulfillmentPct || 100,
      );
    });
  });

  describe('donationsByBlood', () => {
    it('should return donations by blood without grouping', async () => {
      // Arrange
      const timeRange = { from: undefined, to: undefined };
      const groupBy = { groupBy: GroupBy.NONE };
      mockDonationsByBlood.mockResolvedValue(mockDonationsByBloodResult);

      // Act
      const result = await reportsController.donationsByBlood(
        timeRange,
        groupBy,
      );

      // Assert
      expect(mockDonationsByBlood).toHaveBeenCalledWith(timeRange, groupBy);
      expect(result).toEqual(mockDonationsByBloodResult);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return donations by blood grouped by month', async () => {
      // Arrange
      const timeRange = { from: '2025-01-01', to: '2025-12-31' };
      const groupBy = { groupBy: GroupBy.MONTH };
      mockDonationsByBlood.mockResolvedValue(
        mockDonationsByBloodGroupedResult,
      );

      // Act
      const result = await reportsController.donationsByBlood(
        timeRange,
        groupBy,
      );

      // Assert
      expect(mockDonationsByBlood).toHaveBeenCalledWith(timeRange, groupBy);
      expect(result).toEqual(mockDonationsByBloodGroupedResult);
      expect(result).toHaveLength(2);
    });

    it('should return donations by blood grouped by day', async () => {
      // Arrange
      const timeRange = { from: '2025-10-01', to: '2025-10-31' };
      const groupBy = { groupBy: GroupBy.DAY };
      const groupedByDay = [
        {
          period: '2025-10-15',
          items: [
            { type: Type.O, rh: Rh.POSITIVE, donations: 3, units: 1350 },
          ],
        },
        {
          period: '2025-10-16',
          items: [
            { type: Type.A, rh: Rh.NEGATIVE, donations: 2, units: 900 },
          ],
        },
      ];
      mockDonationsByBlood.mockResolvedValue(groupedByDay);

      // Act
      const result = await reportsController.donationsByBlood(
        timeRange,
        groupBy,
      );

      // Assert
      expect(mockDonationsByBlood).toHaveBeenCalledWith(timeRange, groupBy);
      expect(result).toEqual(groupedByDay);
      expect(result).toHaveLength(2);
    });

    it('should return donations with correct totals', async () => {
      // Arrange
      const timeRange = { from: undefined, to: undefined };
      const groupBy = { groupBy: GroupBy.NONE };
      mockDonationsByBlood.mockResolvedValue(mockDonationsByBloodResult);

      // Act
      const result = await reportsController.donationsByBlood(
        timeRange,
        groupBy,
      );

      // Assert
      if (Array.isArray(result) && 'type' in (result[0] || {})) {
        const items = result as typeof mockDonationsByBloodResult;
        expect(items[0]?.donations).toBe(10);
        expect(items[0]?.units).toBe(4500);
        expect(items[1]?.donations).toBe(5);
        expect(items[1]?.units).toBe(2250);
      }
    });
  });

  describe('Controller Definition', () => {
    it('should be defined', () => {
      expect(reportsController).toBeDefined();
    });

    it('should have reportsService injected', () => {
      expect(reportsService).toBeDefined();
    });

    it('should have all report endpoints defined', () => {
      expect(typeof reportsController.inventory).toBe('function');
      expect(typeof reportsController.fulfillment).toBe('function');
      expect(typeof reportsController.overdue).toBe('function');
      expect(typeof reportsController.donorsActivity).toBe('function');
      expect(typeof reportsController.healthEntities).toBe('function');
      expect(typeof reportsController.donationsByBlood).toBe('function');
    });
  });
});
