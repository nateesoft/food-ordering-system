/**
 * Tests for lib/api.ts — fetchApi helper and api object methods
 *
 * @jest-environment jsdom
 */

// Mock localStorage
const mockStorage: Record<string, string> = {};
const localStorageMock = {
  getItem: jest.fn((key: string) => mockStorage[key] || null),
  setItem: jest.fn((key: string, value: string) => { mockStorage[key] = value; }),
  removeItem: jest.fn((key: string) => { delete mockStorage[key]; }),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Dynamic import to ensure mocks are in place before module loads
let api: any;

beforeAll(async () => {
  const module = await import('@/lib/api');
  api = module.api;
});

describe('API Layer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);

    // Default mock: successful JSON response
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: 'test' }),
      status: 200,
      statusText: 'OK',
    });
  });

  describe('fetchApi (via api methods)', () => {
    it('should call fetch with correct URL containing endpoint', async () => {
      await api.getMenuCategories();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/menu/categories'),
        expect.any(Object),
      );
    });

    it('should include Content-Type: application/json header', async () => {
      await api.getMenuCategories();

      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[1].headers['Content-Type']).toBe('application/json');
    });

    it('should inject x-branch-id from localStorage when set', async () => {
      mockStorage['selectedBranchId'] = '5';

      await api.getMenuCategories();

      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[1].headers['x-branch-id']).toBe('5');
    });

    it('should NOT include x-branch-id when localStorage has no branchId', async () => {
      await api.getMenuCategories();

      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[1].headers['x-branch-id']).toBeUndefined();
    });

    it('should throw Error on non-ok response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({}),
      });

      await expect(api.getMenuCategories()).rejects.toThrow('API Error: 404 Not Found');
    });

    it('should return parsed JSON on success', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(['Thai', 'Japanese', 'Western']),
      });

      const result = await api.getMenuCategories();
      expect(result).toEqual(['Thai', 'Japanese', 'Western']);
    });
  });

  describe('api object methods', () => {
    it('getMenuItems should GET /menu', async () => {
      await api.getMenuItems();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/menu'),
        expect.any(Object),
      );
    });

    it('createOrder should POST /orders with body', async () => {
      const orderData = {
        tableNumber: 'A1',
        totalAmount: 250,
        totalItems: 2,
        items: [{ menuItemId: 1, quantity: 1, price: 250 }],
      };
      await api.createOrder(orderData);

      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[0]).toContain('/api/orders');
      expect(callArgs[1].method).toBe('POST');
      expect(JSON.parse(callArgs[1].body)).toEqual(orderData);
    });

    it('createPayment should POST /payments with body', async () => {
      const paymentData = { orderId: 1, paymentMethod: 'CASH', paidAmount: 300 };
      await api.createPayment(paymentData);

      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[0]).toContain('/api/payments');
      expect(callArgs[1].method).toBe('POST');
    });

    it('updateOrderStatus should PATCH /orders/:id/status', async () => {
      await api.updateOrderStatus(5, 'PREPARING');

      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[0]).toContain('/api/orders/5/status');
      expect(callArgs[1].method).toBe('PATCH');
      expect(JSON.parse(callArgs[1].body)).toEqual({ status: 'PREPARING' });
    });

    it('refundPayment should POST /payments/:id/refund', async () => {
      await api.refundPayment(10);

      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[0]).toContain('/api/payments/10/refund');
      expect(callArgs[1].method).toBe('POST');
    });

    it('getIngredients should GET /inventory/ingredients', async () => {
      await api.getIngredients();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/inventory/ingredients'),
        expect.any(Object),
      );
    });

    it('getIngredients with filter should add query param', async () => {
      await api.getIngredients(true);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/inventory/ingredients?isActive=true'),
        expect.any(Object),
      );
    });

    it('adjustStock should POST /inventory/stock/adjust', async () => {
      const data = { ingredientId: 1, quantity: 50, type: 'STOCK_IN', notes: 'Restock' };
      await api.adjustStock(data);

      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[0]).toContain('/api/inventory/stock/adjust');
      expect(callArgs[1].method).toBe('POST');
      expect(JSON.parse(callArgs[1].body)).toEqual(data);
    });

    it('getBranches should GET /branches', async () => {
      await api.getBranches();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/branches'),
        expect.any(Object),
      );
    });
  });
});
