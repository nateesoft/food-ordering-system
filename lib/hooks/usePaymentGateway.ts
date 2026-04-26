'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  initiateGatewayPayment,
  checkGatewayStatus,
  simulateGatewayComplete,
  type GatewayInitResponse,
} from '../payment-gateway/gateway-client';

export type GatewayState = 'idle' | 'initiating' | 'awaiting' | 'completed' | 'failed';

interface UsePaymentGatewayReturn {
  state: GatewayState;
  transactionId: string | null;
  qrCodeData: string | null;
  error: string | null;
  initiate: (amount: number, paymentMethod: string) => Promise<void>;
  simulateComplete: () => Promise<void>;
  reset: () => void;
}

export function usePaymentGateway(): UsePaymentGatewayReturn {
  const [state, setState] = useState<GatewayState>('idle');
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const startPolling = useCallback((txnId: string) => {
    stopPolling();
    pollingRef.current = setInterval(async () => {
      try {
        const status = await checkGatewayStatus(txnId);
        if (status.status === 'COMPLETED') {
          setState('completed');
          stopPolling();
        } else if (status.status === 'FAILED') {
          setState('failed');
          setError('Payment failed');
          stopPolling();
        }
      } catch {
        // Continue polling on error
      }
    }, 2000);
  }, [stopPolling]);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  const initiate = useCallback(async (amount: number, paymentMethod: string) => {
    try {
      setState('initiating');
      setError(null);
      const response = await initiateGatewayPayment(amount, paymentMethod);
      setTransactionId(response.transactionId);
      setQrCodeData(response.qrCodeData || null);
      setState('awaiting');
      startPolling(response.transactionId);
    } catch (err: any) {
      setState('failed');
      setError(err.message || 'Failed to initiate payment');
    }
  }, [startPolling]);

  const simulateComplete = useCallback(async () => {
    if (!transactionId) return;
    try {
      await simulateGatewayComplete(transactionId);
      setState('completed');
      stopPolling();
    } catch (err: any) {
      setError(err.message || 'Failed to simulate completion');
    }
  }, [transactionId, stopPolling]);

  const reset = useCallback(() => {
    stopPolling();
    setState('idle');
    setTransactionId(null);
    setQrCodeData(null);
    setError(null);
  }, [stopPolling]);

  return {
    state,
    transactionId,
    qrCodeData,
    error,
    initiate,
    simulateComplete,
    reset,
  };
}
