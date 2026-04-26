'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { getPrinterService, type PrinterServiceConfig, type ConnectionType } from '../printer/printer-service';
import type { ReceiptData } from '../printer/receipt-formatter';

interface UsePrinterReturn {
  isConnected: boolean;
  isPrinting: boolean;
  connectionType: ConnectionType;
  supportedConnections: ConnectionType[];
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  printReceipt: (data: Omit<ReceiptData, 'shopName' | 'shopAddress' | 'shopPhone' | 'shopTaxId' | 'footerText'>) => Promise<void>;
  printTaxInvoice: (data: any) => Promise<void>;
  openCashDrawer: () => Promise<void>;
  testPrint: () => Promise<void>;
  updateConfig: (config: Partial<PrinterServiceConfig>) => void;
}

export function usePrinter(initialConfig?: Partial<PrinterServiceConfig>): UsePrinterReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const serviceRef = useRef(getPrinterService(initialConfig));

  // Load saved config from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('printer_config');
      if (saved) {
        const config = JSON.parse(saved);
        serviceRef.current.updateConfig(config);
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  const connect = useCallback(async () => {
    try {
      setError(null);
      await serviceRef.current.connect();
      setIsConnected(true);
    } catch (err: any) {
      setError(err.message || 'Failed to connect printer');
      setIsConnected(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    await serviceRef.current.disconnect();
    setIsConnected(false);
  }, []);

  const printReceipt = useCallback(async (data: Omit<ReceiptData, 'shopName' | 'shopAddress' | 'shopPhone' | 'shopTaxId' | 'footerText'>) => {
    try {
      setIsPrinting(true);
      setError(null);
      await serviceRef.current.printReceipt(data);
    } catch (err: any) {
      setError(err.message || 'Print failed');
      throw err;
    } finally {
      setIsPrinting(false);
    }
  }, []);

  const printTaxInvoice = useCallback(async (data: any) => {
    try {
      setIsPrinting(true);
      setError(null);
      await serviceRef.current.printTaxInvoice(data);
    } catch (err: any) {
      setError(err.message || 'Print failed');
      throw err;
    } finally {
      setIsPrinting(false);
    }
  }, []);

  const openCashDrawer = useCallback(async () => {
    try {
      setError(null);
      await serviceRef.current.openCashDrawer();
    } catch (err: any) {
      setError(err.message || 'Failed to open cash drawer');
    }
  }, []);

  const testPrint = useCallback(async () => {
    try {
      setIsPrinting(true);
      setError(null);
      await serviceRef.current.testPrint();
    } catch (err: any) {
      setError(err.message || 'Test print failed');
    } finally {
      setIsPrinting(false);
    }
  }, []);

  const updateConfig = useCallback((config: Partial<PrinterServiceConfig>) => {
    serviceRef.current.updateConfig(config);
    localStorage.setItem('printer_config', JSON.stringify(config));
  }, []);

  return {
    isConnected,
    isPrinting,
    connectionType: serviceRef.current.connectionType,
    supportedConnections: typeof window !== 'undefined' ? getPrinterService().constructor.prototype.constructor['getSupportedConnections']?.() || [] : [],
    error,
    connect,
    disconnect,
    printReceipt,
    printTaxInvoice,
    openCashDrawer,
    testPrint,
    updateConfig,
  };
}
