const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}/api`;
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api';
};

export interface GatewayInitResponse {
  transactionId: string;
  status: string;
  qrCodeData?: string;
  expiresAt?: string;
}

export interface GatewayStatusResponse {
  transactionId: string;
  status: string;
  amount: number;
  completedAt?: string;
}

function getBranchId(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('selectedBranchId');
  }
  return null;
}

export async function initiateGatewayPayment(
  amount: number,
  paymentMethod: string,
): Promise<GatewayInitResponse> {
  const res = await fetch(`${getApiBaseUrl()}/payment-gateway`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(getBranchId() ? { 'x-branch-id': getBranchId()! } : {}),
    },
    body: JSON.stringify({ amount, paymentMethod }),
  });

  if (!res.ok) throw new Error('Failed to initiate payment');
  return res.json();
}

export async function checkGatewayStatus(
  transactionId: string,
): Promise<GatewayStatusResponse> {
  const res = await fetch(`${getApiBaseUrl()}/payment-gateway/${transactionId}/status`, {
    headers: getBranchId() ? { 'x-branch-id': getBranchId()! } : {},
  });

  if (!res.ok) throw new Error('Failed to check payment status');
  return res.json();
}

export async function simulateGatewayComplete(
  transactionId: string,
): Promise<GatewayStatusResponse> {
  const res = await fetch(`${getApiBaseUrl()}/payment-gateway/${transactionId}/simulate-complete`, {
    method: 'POST',
    headers: getBranchId() ? { 'x-branch-id': getBranchId()! } : {},
  });

  if (!res.ok) throw new Error('Failed to simulate completion');
  return res.json();
}
