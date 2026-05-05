const getApiBaseUrl = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5555/api';
  if (typeof window !== 'undefined') {
    try {
      const { port, pathname } = new URL(apiUrl);
      return `${window.location.protocol}//${window.location.hostname}:${port}${pathname}`;
    } catch {
      return apiUrl;
    }
  }
  return apiUrl;
};

const API_BASE_URL = getApiBaseUrl();

export interface ApiNestedMenuOption {
  id: number;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  type: string;
  requireChildSelection: boolean;
  minChildSelections: number | null;
  maxChildSelections: number | null;
  children?: ApiNestedMenuOption[];
}

export interface ApiNestedMenuConfig {
  id: number;
  enabled: boolean;
  requireSelection: boolean;
  minSelections: number;
  maxSelections: number;
  rootOptions: {
    nestedMenuOption: ApiNestedMenuOption;
  }[];
}

export interface ApiMenuItem {
  id: number;
  code: string;
  name: string;
  category: string;
  price: number;
  image: string | null;
  description: string | null;
  rating: number | null;
  reviewCount: number;
  type: 'SINGLE' | 'SET' | 'GROUP';
  isActive: boolean;
  setComponents: any[];
  availableAddOns: any[];
  availableAddOnGroups: any[];
  nestedMenuConfig: ApiNestedMenuConfig | null;
}

export interface ApiAddOn {
  id: number;
  name: string;
  price: number;
  category: string;
  isActive: boolean;
}

export interface ApiAddOnGroup {
  id: number;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image: string | null;
  isActive: boolean;
  items: any[];
}

export interface CreateQueueTicketDto {
  orderType: string;
  totalAmount: number;
  totalItems: number;
  customerName?: string;
  memberId?: string;
  paymentMethod?: string;
  items: {
    menuItemId: number;
    quantity: number;
    price: number;
    diningOption: string;
    specialInstructions?: string;
    selectedAddOns?: any;
    selectedAddOnGroups?: any;
    selectedNestedOptions?: any;
  }[];
}

export interface QueueTicketResponse {
  id: number;
  queueId: string;
  queueNumber: number;
  orderType: string;
  totalAmount: number;
  totalItems: number;
  status: string;
  estimatedTime: number | null;
  customerName: string | null;
  memberId: string | null;
  paymentMethod: string | null;
  items: any;
  createdAt: string;
}

export interface StaffInfo {
  id: number;
  name: string;
  role: string;
  checkedInAt: string;
  lastSeenAt: string;
}

export interface CreateServiceRequestDto {
  type: 'STAFF' | 'UTENSILS' | 'PAYMENT';
  tableNumber?: string;
  details?: string;
  items?: string[];
}

export interface ServiceRequestResponse {
  id: number;
  requestId: string;
  type: string;
  branchId: string | null;
  tableNumber: string | null;
  details: string | null;
  items: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderDto {
  tableNumber: string;
  totalAmount: number;
  totalItems: number;
  serviceCharge?: number;
  vat?: number;
  sessionId?: number;
  items: {
    menuItemId: number;
    quantity: number;
    price: number;
    diningOption: string;
    specialInstructions?: string;
    selectedAddOns?: any;
    selectedAddOnGroups?: any;
    selectedNestedOptions?: any;
  }[];
}

export interface OrderResponse {
  id: number;
  orderId: string;
  branchId: string;
  tableNumber: string;
  totalAmount: number;
  totalItems: number;
  status: string;
  items: any;
  createdAt: string;
  updatedAt: string;
}

// Staff Check-in Types
export interface StaffCheckInDto {
  pin: string;
  branchId: string;
  tableNumber: string;
}

export interface StaffCheckOutDto {
  pin: string;
  branchId: string;
  tableNumber: string;
}

export interface TableStaffResponse {
  branchId: string;
  tableNumber: string;
  staff: StaffInfo[];
}

export interface StaffCheckInResponse {
  message: string;
  assignment: {
    id: number;
    branchId: string;
    tableNumber: string;
    userId: number;
    checkedInAt: string;
    lastSeenAt: string;
    isActive: boolean;
    user: {
      id: number;
      name: string;
      role: string;
    };
  };
}

export interface ShiftResponse {
  id: number;
  shiftNumber: string;
  status: 'OPEN' | 'CLOSED';
  userId: number;
  cashierName: string;
  branchId: number | null;
  openedAt: string;
  closedAt: string | null;
  openingAmount: number;
  closingAmount: number | null;
  expectedCashAmount: number | null;
  cashDifference: number | null;
  totalRevenue: number | null;
  totalOrders: number | null;
  cashTotal: number | null;
  transferTotal: number | null;
  creditCardTotal: number | null;
  openingCashCount: Record<string, number> | null;
  closingCashCount: Record<string, number> | null;
  notes: string | null;
  closingNotes: string | null;
}

export interface ShiftSummaryResponse extends ShiftResponse {
  payments: any[];
}

export interface PromotionResponse {
  id: number;
  name: string;
  description: string | null;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'COUPON' | 'HAPPY_HOUR';
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  discountValue: number;
  maxDiscount: number | null;
  couponCode: string | null;
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  minOrderAmount: number | null;
  categories: string[];
  maxUses: number | null;
  currentUses: number;
  branchId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface PromotionStatsResponse {
  totalActive: number;
  totalUsesToday: number;
  totalDiscountToday: number;
}

export interface CouponValidationResponse {
  valid: boolean;
  message: string;
  promotion?: PromotionResponse;
  discountAmount?: number;
}

export type WebhookEvent =
  | 'ORDER_CREATED'
  | 'ORDER_STATUS_CHANGED'
  | 'ORDER_CANCELLED'
  | 'PAYMENT_COMPLETED'
  | 'PAYMENT_REFUNDED'
  | 'QUEUE_CREATED'
  | 'QUEUE_STATUS_CHANGED'
  | 'MEMBER_REGISTERED'
  | 'SHIFT_OPENED'
  | 'SHIFT_CLOSED'
  | 'LOW_STOCK_ALERT';

export interface WebhookEndpointResponse {
  id: number;
  name: string;
  url: string;
  secret: string;
  events: WebhookEvent[];
  isActive: boolean;
  branchId: number | null;
  headers: Record<string, string> | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookDeliveryResponse {
  id: number;
  webhookId: number;
  event: WebhookEvent;
  payload: any;
  responseStatus: number | null;
  responseBody: string | null;
  success: boolean;
  attempts: number;
  error: string | null;
  duration: number | null;
  createdAt: string;
}

export interface WebhookEventInfo {
  value: WebhookEvent;
  label: string;
}

export interface WebhookTestResult {
  success: boolean;
  responseStatus: number | null;
  responseBody: string | null;
  error: string | null;
  duration: number | null;
  delivery: WebhookDeliveryResponse;
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const branchHeaders: Record<string, string> = {};
  if (typeof window !== 'undefined') {
    const branchId = localStorage.getItem('selectedBranchId');
    if (branchId) {
      branchHeaders['x-branch-id'] = branchId;
    }
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...branchHeaders,
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody?.message || `API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export interface AuditLogEntry {
  id: number;
  action: string;
  entityType: string;
  entityId: number;
  entityRef: string | null;
  performedBy: string | null;
  branchId: number | null;
  oldValues: Record<string, any> | null;
  newValues: Record<string, any> | null;
  metadata: Record<string, any> | null;
  createdAt: string;
}

export const api = {
  // Menu
  getMenuItems: (params?: { category?: string; isActive?: boolean }) => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.append('category', params.category);
    if (params?.isActive !== undefined) searchParams.append('isActive', String(params.isActive));
    const query = searchParams.toString();
    return fetchApi<ApiMenuItem[]>(`/menu${query ? `?${query}` : ''}`);
  },

  getMenuCategories: () => fetchApi<string[]>('/menu/categories'),

  getMenuItem: (id: number) => fetchApi<ApiMenuItem>(`/menu/${id}`),

  // AddOns
  getAddOns: () => fetchApi<ApiAddOn[]>('/addons'),

  getAddOnGroups: () => fetchApi<ApiAddOnGroup[]>('/addon-groups'),

  // Queue
  createQueueTicket: (data: CreateQueueTicketDto) =>
    fetchApi<QueueTicketResponse>('/queue', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getQueueTicket: (queueId: string) => fetchApi<QueueTicketResponse>(`/queue/queue-id/${queueId}`),

  getWaitingQueues: () => fetchApi<QueueTicketResponse[]>('/queue/waiting'),

  getReadyQueues: () => fetchApi<QueueTicketResponse[]>('/queue/ready'),

  getTodayQueues: () => fetchApi<QueueTicketResponse[]>('/queue/today'),

  getAllQueues: (status?: string) => {
    const query = status ? `?status=${status}` : '';
    return fetchApi<QueueTicketResponse[]>(`/queue${query}`);
  },

  getQueueStats: () => fetchApi<any>('/queue/stats'),

  updateQueueStatus: (id: number, status: string) =>
    fetchApi<QueueTicketResponse>(`/queue/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  callQueue: (id: number) =>
    fetchApi<QueueTicketResponse>(`/queue/${id}/call`, {
      method: 'POST',
    }),

  // Members
  getMemberByMemberId: (memberId: string) => fetchApi<any>(`/members/member-id/${memberId}`),

  // Orders
  createOrder: (data: CreateOrderDto) =>
    fetchApi<OrderResponse>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getOrdersByTable: (tableNumber: string) =>
    fetchApi<OrderResponse[]>(`/orders/table/${tableNumber}`),

  getTodayOrders: () => fetchApi<OrderResponse[]>(`/orders/today`),

  getAllOrders: () => fetchApi<OrderResponse[]>(`/orders`),

  getTableOrdersAll: (tableNumber: string) =>
    fetchApi<OrderResponse[]>(`/orders?tableNumber=${tableNumber}`),

  updateOrderStatus: (id: number, status: 'PREPARING' | 'COMPLETED' | 'DELIVERED' | 'CANCELLED') =>
    fetchApi<OrderResponse>(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  completeOrdersByTable: (tableNumber: string) =>
    fetchApi<{ count: number }>(`/orders/complete-by-table/${tableNumber}`, {
      method: 'PATCH',
    }),

  updateOrderItemStatus: (orderId: number, itemId: number, status: string) =>
    fetchApi<any>(`/orders/${orderId}/items/${itemId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // Service Requests
  createServiceRequest: (data: CreateServiceRequestDto) =>
    fetchApi<ServiceRequestResponse>('/service-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getPendingServiceRequests: () =>
    fetchApi<ServiceRequestResponse[]>('/service-requests/pending'),

  getAllServiceRequests: () =>
    fetchApi<ServiceRequestResponse[]>('/service-requests'),

  updateServiceRequestStatus: (id: number, status: 'COMPLETED' | 'PENDING') =>
    fetchApi<ServiceRequestResponse>(`/service-requests/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // Staff Check-in
  staffCheckIn: (data: StaffCheckInDto) =>
    fetchApi<StaffCheckInResponse>('/staff/check-in', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  staffCheckOut: (data: StaffCheckOutDto) =>
    fetchApi<StaffCheckInResponse>('/staff/check-out', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  staffHeartbeat: (data: StaffCheckInDto) =>
    fetchApi<{ message: string; lastSeenAt: string; staffName: string }>('/staff/heartbeat', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  verifyStaffPin: (pin: string) =>
    fetchApi<{ valid: boolean; staff: { id: number; name: string; role: string } }>('/staff/verify-pin', {
      method: 'POST',
      body: JSON.stringify({ pin }),
    }),

  getTableStaff: (branchId: string, tableNumber: string) =>
    fetchApi<TableStaffResponse>(`/${branchId}/tables/number/${tableNumber}/staff`),

  // Get all staff assignments grouped by table (for floor plan)
  getAllStaffAssignments: () =>
    fetchApi<Record<string, {
      staffId: number;
      staffName: string;
      staffRole: string;
      checkedInAt: string;
      lastSeenAt: string;
    }[]>>('/staff/assignments/public'),

  // User Management
  getUsers: () => fetchApi<any[]>('/auth/users'),

  getUser: (id: number) => fetchApi<any>(`/auth/users/${id}`),

  createUser: (data: { username: string; password: string; name: string; role?: string }) =>
    fetchApi<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateUser: (id: number, data: { name?: string; role?: string; pin?: string; isActive?: boolean; password?: string }) =>
    fetchApi<any>(`/auth/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteUser: (id: number) =>
    fetchApi<any>(`/auth/users/${id}`, {
      method: 'DELETE',
    }),

  // Orders - unpaid
  getUnpaidOrders: () => fetchApi<OrderResponse[]>('/orders/unpaid'),

  // Members - additional
  getAllMembers: () => fetchApi<any[]>('/members'),

  getMemberByPhone: (phone: string) => fetchApi<any>(`/members/phone/${phone}`),

  // Payments
  createPayment: (data: {
    orderId: number;
    paymentMethod: string;
    paidAmount: number;
    memberId?: string;
    discountPoints?: number;
    cashierName?: string;
    note?: string;
    shiftId?: number;
    promotionId?: number;
    couponCode?: string;
    serviceCharge?: number;
    vat?: number;
    splitPayments?: { method: string; amount: number }[];
  }) =>
    fetchApi<any>('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getPayments: (params?: { today?: boolean; paymentMethod?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.today) searchParams.append('today', 'true');
    if (params?.paymentMethod) searchParams.append('paymentMethod', params.paymentMethod);
    const query = searchParams.toString();
    return fetchApi<any[]>(`/payments${query ? `?${query}` : ''}`);
  },

  getPayment: (id: number) => fetchApi<any>(`/payments/${id}`),

  getPaymentByReceipt: (receiptNumber: string) =>
    fetchApi<any>(`/payments/receipt/${receiptNumber}`),

  getPaymentByOrder: (orderId: number) =>
    fetchApi<any[]>(`/payments/order/${orderId}`),

  getPaymentSummary: () => fetchApi<any>('/payments/summary/today'),

  refundPayment: (id: number) =>
    fetchApi<any>(`/payments/${id}/refund`, {
      method: 'POST',
    }),

  // ===== Inventory =====

  // Ingredients
  getIngredients: (isActive?: boolean) => {
    const params = isActive !== undefined ? `?isActive=${isActive}` : '';
    return fetchApi<any[]>(`/inventory/ingredients${params}`);
  },

  getIngredient: (id: number) => fetchApi<any>(`/inventory/ingredients/${id}`),

  createIngredient: (data: { name: string; unit: string; currentStock?: number; minStock?: number; costPerUnit?: number }) =>
    fetchApi<any>('/inventory/ingredients', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateIngredient: (id: number, data: Record<string, any>) =>
    fetchApi<any>(`/inventory/ingredients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteIngredient: (id: number) =>
    fetchApi<any>(`/inventory/ingredients/${id}`, {
      method: 'DELETE',
    }),

  // Recipes
  getAllRecipes: () => fetchApi<any[]>('/inventory/recipes'),

  getRecipe: (menuItemId: number) => fetchApi<any[]>(`/inventory/recipes/${menuItemId}`),

  setRecipe: (data: { menuItemId: number; ingredients: { ingredientId: number; quantityUsed: number }[] }) =>
    fetchApi<any>('/inventory/recipes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteRecipe: (menuItemId: number) =>
    fetchApi<any>(`/inventory/recipes/${menuItemId}`, {
      method: 'DELETE',
    }),

  // Stock
  adjustStock: (data: { ingredientId: number; quantity: number; type: string; notes?: string }) =>
    fetchApi<any>('/inventory/stock/adjust', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Alerts & Monitoring
  getLowStockAlerts: () => fetchApi<any[]>('/inventory/alerts/low-stock'),

  getMenuAvailability: () => fetchApi<{ menuItemId: number; available: boolean; insufficientIngredients: string[] }[]>('/inventory/menu-availability'),

  getStockOverview: () => fetchApi<any>('/inventory/stock-overview'),

  // Transactions
  getInventoryTransactions: (params?: { ingredientId?: number; type?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.ingredientId) searchParams.append('ingredientId', String(params.ingredientId));
    if (params?.type) searchParams.append('type', params.type);
    const query = searchParams.toString();
    return fetchApi<any[]>(`/inventory/transactions${query ? `?${query}` : ''}`);
  },

  // ===== Reports =====
  getRevenueReport: (startDate: string, endDate: string) =>
    fetchApi<any>(`/dashboard/reports/revenue?startDate=${startDate}&endDate=${endDate}`),

  getOrdersReport: (startDate: string, endDate: string) =>
    fetchApi<any>(`/dashboard/reports/orders?startDate=${startDate}&endDate=${endDate}`),

  getMenuPerformanceReport: (startDate: string, endDate: string) =>
    fetchApi<any>(`/dashboard/reports/menu-performance?startDate=${startDate}&endDate=${endDate}`),

  getMemberAnalytics: () =>
    fetchApi<any>('/dashboard/reports/member-analytics'),

  getDailySummary: (startDate: string, endDate: string) =>
    fetchApi<any[]>(`/dashboard/reports/daily-summary?startDate=${startDate}&endDate=${endDate}`),

  // ===== Branches =====
  getBranches: () => fetchApi<any[]>('/branches'),

  getBranch: (id: number) => fetchApi<any>(`/branches/${id}`),

  createBranch: (data: { name: string; code: string; address?: string; phone?: string }) =>
    fetchApi<any>('/branches', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateBranch: (id: number, data: { name?: string; code?: string; address?: string; phone?: string; isActive?: boolean }) =>
    fetchApi<any>(`/branches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteBranch: (id: number) =>
    fetchApi<any>(`/branches/${id}`, {
      method: 'DELETE',
    }),

  // ===== Shifts =====
  openShift: (data: { pin: string; openingAmount: number; openingCashCount?: Record<string, number>; notes?: string }) =>
    fetchApi<ShiftResponse>('/shifts/open', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  closeShift: (id: number, data: { closingAmount: number; closingCashCount?: Record<string, number>; notes?: string }) =>
    fetchApi<ShiftResponse>(`/shifts/${id}/close`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getActiveShift: () => fetchApi<ShiftResponse | null>('/shifts/active'),

  getShifts: (params?: { status?: string; startDate?: string; endDate?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    const query = searchParams.toString();
    return fetchApi<ShiftResponse[]>(`/shifts${query ? `?${query}` : ''}`);
  },

  getShift: (id: number) => fetchApi<ShiftResponse>(`/shifts/${id}`),

  getShiftSummary: (id: number) => fetchApi<ShiftSummaryResponse>(`/shifts/${id}/summary`),

  // ===== Promotions =====
  getPromotions: (status?: string) => {
    const query = status ? `?status=${status}` : '';
    return fetchApi<PromotionResponse[]>(`/promotions${query}`);
  },

  getAvailablePromotions: (subtotal?: number) => {
    const query = subtotal ? `?subtotal=${subtotal}` : '';
    return fetchApi<PromotionResponse[]>(`/promotions/available${query}`);
  },

  getPromotionStats: () => fetchApi<PromotionStatsResponse>('/promotions/stats'),

  getPromotion: (id: number) => fetchApi<PromotionResponse>(`/promotions/${id}`),

  createPromotion: (data: {
    name: string;
    type: string;
    discountValue: number;
    maxDiscount?: number;
    couponCode?: string;
    startDate: string;
    endDate: string;
    startTime?: string;
    endTime?: string;
    minOrderAmount?: number;
    categories?: string[];
    maxUses?: number;
    description?: string;
  }) =>
    fetchApi<PromotionResponse>('/promotions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updatePromotion: (id: number, data: Record<string, any>) =>
    fetchApi<PromotionResponse>(`/promotions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deletePromotion: (id: number) =>
    fetchApi<PromotionResponse>(`/promotions/${id}`, {
      method: 'DELETE',
    }),

  validateCoupon: (couponCode: string, subtotal: number) =>
    fetchApi<CouponValidationResponse>('/promotions/validate-coupon', {
      method: 'POST',
      body: JSON.stringify({ couponCode, subtotal }),
    }),

  // ===== Merge / Split Orders =====
  createMergedPayment: (data: {
    orderIds: number[];
    paymentMethod: string;
    paidAmount: number;
    memberId?: string;
    discountPoints?: number;
    cashierName?: string;
    note?: string;
    shiftId?: number;
    promotionId?: number;
    couponCode?: string;
    splitPayments?: { method: string; amount: number }[];
  }) =>
    fetchApi<any>('/payments/merge', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  splitOrder: (orderId: number, groups: { itemIds: number[] }[]) =>
    fetchApi<any>(`/orders/${orderId}/split`, {
      method: 'POST',
      body: JSON.stringify({ groups }),
    }),

  // ===== Tables & Sessions =====
  getTables: (params?: { status?: string; zone?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.zone) searchParams.append('zone', params.zone);
    const query = searchParams.toString();
    return fetchApi<any[]>(`/tables${query ? `?${query}` : ''}`);
  },

  getTableStats: () => fetchApi<{ available: number; occupied: number; reserved: number; total: number }>('/tables/stats'),

  getTableZones: () => fetchApi<string[]>('/tables/zones'),

  updateTableStatus: (id: number, status: string, currentGuests?: number) =>
    fetchApi<any>(`/tables/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, currentGuests }),
    }),

  openTableSession: (tableId: number, data: {
    openedBy: string;
    customerCount?: number;
    customerGender?: string;
    customerNationality?: string;
    orderType?: string;
  }) =>
    fetchApi<any>(`/tables/${tableId}/open-session`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  closeTableSession: (tableId: number) =>
    fetchApi<any>(`/tables/${tableId}/close-session`, {
      method: 'POST',
    }),

  getActiveTableSession: (tableId: number) =>
    fetchApi<any>(`/tables/${tableId}/active-session`),

  // Table CRUD (Admin)
  createTable: (data: {
    number: string;
    capacity: number;
    size: string;
    shape?: string;
    positionX: number;
    positionY: number;
    zone?: string;
    status?: string;
  }) =>
    fetchApi<any>('/tables', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateTable: (id: number, data: Record<string, any>) =>
    fetchApi<any>(`/tables/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteTable: (id: number) =>
    fetchApi<any>(`/tables/${id}`, {
      method: 'DELETE',
    }),

  getTable: (id: number) => fetchApi<any>(`/tables/${id}`),

  getTableByNumber: (number: string) => fetchApi<any>(`/tables/number/${number}`),

  bulkUpdateTablePositions: (updates: { id: number; positionX: number; positionY: number }[]) =>
    fetchApi<any>('/tables/bulk-positions', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  transferTable: (fromTableId: number, data: { toTableId: number; performedBy?: string }) =>
    fetchApi<{
      fromTable: any;
      toTable: any;
      transferredOrders: { id: number; orderId: string; totalAmount: number; totalItems: number }[];
      newSession: any;
    }>(`/tables/${fromTableId}/transfer`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // ===== Webhooks =====
  getWebhooks: () => fetchApi<WebhookEndpointResponse[]>('/webhooks'),

  getWebhook: (id: number) => fetchApi<WebhookEndpointResponse>(`/webhooks/${id}`),

  createWebhook: (data: {
    name: string;
    url: string;
    events: WebhookEvent[];
    isActive?: boolean;
    headers?: Record<string, string>;
    description?: string;
  }) =>
    fetchApi<WebhookEndpointResponse>('/webhooks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateWebhook: (id: number, data: Record<string, any>) =>
    fetchApi<WebhookEndpointResponse>(`/webhooks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteWebhook: (id: number) =>
    fetchApi<{ message: string }>(`/webhooks/${id}`, {
      method: 'DELETE',
    }),

  testWebhook: (id: number) =>
    fetchApi<WebhookTestResult>(`/webhooks/${id}/test`, {
      method: 'POST',
    }),

  getWebhookDeliveries: (id: number, limit?: number) => {
    const query = limit ? `?limit=${limit}` : '';
    return fetchApi<WebhookDeliveryResponse[]>(`/webhooks/${id}/deliveries${query}`);
  },

  getWebhookEvents: () => fetchApi<WebhookEventInfo[]>('/webhooks/events'),

  // Upload / Image Management
  uploadImage: async (file: File): Promise<{ url: string; filename: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/upload/image`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `Upload failed: ${response.status}`);
    }

    return response.json();
  },

  getUploadedImages: () =>
    fetchApi<{ images: { url: string; filename: string; size: number; uploadedAt: string }[] }>('/upload/images'),

  deleteUploadedImage: (filename: string) =>
    fetchApi<{ message: string }>(`/upload/images/${filename}`, { method: 'DELETE' }),

  // Audit Logs
  getAuditLogs: (filters?: {
    entityType?: string;
    entityId?: number;
    action?: string;
    performedBy?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters?.entityType) params.append('entityType', filters.entityType);
    if (filters?.entityId) params.append('entityId', String(filters.entityId));
    if (filters?.action) params.append('action', filters.action);
    if (filters?.performedBy) params.append('performedBy', filters.performedBy);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));
    const qs = params.toString();
    return fetchApi<{
      data: AuditLogEntry[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/audit-logs${qs ? `?${qs}` : ''}`);
  },

  getAuditLog: (id: number) => fetchApi<AuditLogEntry>(`/audit-logs/${id}`),

  getAuditLogsByEntity: (entityType: string, entityId: number) =>
    fetchApi<AuditLogEntry[]>(`/audit-logs/entity/${entityType}/${entityId}`),

  getAuditStats: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const qs = params.toString();
    return fetchApi<{
      total: number;
      byAction: { action: string; count: number }[];
    }>(`/audit-logs/stats${qs ? `?${qs}` : ''}`);
  },

  // ==========================================
  // Tax Invoice
  // ==========================================
  createTaxInvoice: (data: { paymentId: number; buyerName: string; buyerTaxId: string; buyerAddress: string; buyerBranch?: string }) =>
    fetchApi<any>('/tax-invoices', { method: 'POST', body: JSON.stringify(data) }),

  getTaxInvoices: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const qs = params.toString();
    return fetchApi<any[]>(`/tax-invoices${qs ? `?${qs}` : ''}`);
  },

  getTaxInvoice: (id: number) => fetchApi<any>(`/tax-invoices/${id}`),

  voidTaxInvoice: (id: number, reason: string) =>
    fetchApi<any>(`/tax-invoices/${id}/void`, { method: 'POST', body: JSON.stringify({ reason }) }),

  getCompanyTaxInfo: () => fetchApi<any>('/tax-invoices/company/info'),

  updateCompanyTaxInfo: (data: { companyName: string; taxId: string; address: string; phone?: string; companyNameEn?: string; branchNumber?: string; branchName?: string; isHeadOffice?: boolean }) =>
    fetchApi<any>('/tax-invoices/company/info', { method: 'POST', body: JSON.stringify(data) }),

  // ==========================================
  // Payment Gateway
  // ==========================================
  initiateGatewayPayment: (data: { amount: number; paymentMethod: string }) =>
    fetchApi<any>('/payment-gateway', { method: 'POST', body: JSON.stringify(data) }),

  checkGatewayStatus: (transactionId: string) =>
    fetchApi<any>(`/payment-gateway/${transactionId}/status`),

  simulateGatewayComplete: (transactionId: string) =>
    fetchApi<any>(`/payment-gateway/${transactionId}/simulate-complete`, { method: 'POST' }),

  // ==========================================
  // KDS (Kitchen Display System)
  // ==========================================
  getKDSOrders: (stationId?: number) => {
    const qs = stationId ? `?stationId=${stationId}` : '';
    return fetchApi<any[]>(`/kds/orders${qs}`);
  },

  getKDSStations: () => fetchApi<any[]>('/kds/stations'),

  createKDSStation: (data: { name: string; categories: string[]; color?: string; alertTimeout?: number }) =>
    fetchApi<any>('/kds/stations', { method: 'POST', body: JSON.stringify(data) }),

  updateKDSStation: (id: number, data: any) =>
    fetchApi<any>(`/kds/stations/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  deleteKDSStation: (id: number) =>
    fetchApi<any>(`/kds/stations/${id}`, { method: 'DELETE' }),

  bumpKDSItem: (orderId: number, itemId: number, status: string) =>
    fetchApi<any>(`/kds/orders/${orderId}/items/${itemId}/bump`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};

export default api;
