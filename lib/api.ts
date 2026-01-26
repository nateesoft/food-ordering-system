const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface ApiMenuItem {
  id: number;
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
  nestedMenuConfig: any | null;
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

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
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

  // Members
  getMemberByMemberId: (memberId: string) => fetchApi<any>(`/members/member-id/${memberId}`),
};

export default api;
