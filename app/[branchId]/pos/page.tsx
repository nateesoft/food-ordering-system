'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api, ShiftResponse } from '@/lib/api';
import { Payment, PaymentSummary, TableSession } from '@/types';

// Components
import PinLogin from './components/PinLogin';
import POSHeader, { POSView } from './components/POSHeader';
import { OpenShiftModal, CloseShiftModal } from './components/POSShiftModals';
import POSFloorPlan from './components/POSFloorPlan';
import POSTableSession from './components/POSTableSession';
import POSMenuOrder from './components/POSMenuOrder';
import POSPayment from './components/POSPayment';
import POSOrderStatus from './components/POSOrderStatus';
import POSReceipt from './components/POSReceipt';
import POSHistory from './components/POSHistory';

const DENOMINATIONS = [1000, 500, 100, 50, 20, 10, 5, 2, 1];

interface SelectedTable {
  id: number;
  number: string;
  capacity: number;
  status: string;
  zone: string | null;
  currentGuests: number | null;
}

export default function POSPage({ params }: { params: { branchId: string } }) {
  // Sync branchId from URL into localStorage so fetchApi sends the correct x-branch-id header
  useEffect(() => {
    if (params.branchId) {
      localStorage.setItem('selectedBranchId', params.branchId);
    }
  }, [params.branchId]);

  // Auth
  const [cashierName, setCashierName] = useState<string | null>(null);

  // Shift
  const [activeShift, setActiveShift] = useState<ShiftResponse | null>(null);
  const [shiftLoading, setShiftLoading] = useState(false);
  const [showOpenShiftModal, setShowOpenShiftModal] = useState(false);
  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
  const [shiftOpeningAmount, setShiftOpeningAmount] = useState(0);
  const [shiftOpeningCashCount, setShiftOpeningCashCount] = useState<Record<string, number>>({});
  const [shiftClosingAmount, setShiftClosingAmount] = useState(0);
  const [shiftClosingCashCount, setShiftClosingCashCount] = useState<Record<string, number>>({});
  const [shiftNotes, setShiftNotes] = useState('');
  const [shiftError, setShiftError] = useState('');
  const [shiftProcessing, setShiftProcessing] = useState(false);
  const [shiftSummaryData, setShiftSummaryData] = useState<any>(null);

  // Navigation
  const [currentView, setCurrentView] = useState<POSView | 'session-form' | 'order-status'>('floor-plan');

  // Table & Session
  const [selectedTable, setSelectedTable] = useState<SelectedTable | null>(null);
  const [currentSession, setCurrentSession] = useState<TableSession | null>(null);

  // Summary
  const [summary, setSummary] = useState<PaymentSummary | null>(null);

  // Modals
  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null);
  const [receiptMergedOrders, setReceiptMergedOrders] = useState<any[] | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // ===== Shift Logic =====

  const checkActiveShift = useCallback(async () => {
    setShiftLoading(true);
    try {
      const shift = await api.getActiveShift();
      setActiveShift(shift);
      if (!shift) {
        setShowOpenShiftModal(true);
      }
    } catch (err) {
      console.error('Failed to check active shift:', err);
    } finally {
      setShiftLoading(false);
    }
  }, []);

  useEffect(() => {
    if (cashierName) {
      checkActiveShift();
    }
  }, [cashierName, checkActiveShift]);

  const handleOpenShiftWithPin = async (pin: string) => {
    setShiftProcessing(true);
    setShiftError('');
    try {
      const cashCountTotal = DENOMINATIONS.reduce((sum, d) => sum + (shiftOpeningCashCount[String(d)] || 0) * d, 0);
      const amount = cashCountTotal > 0 ? cashCountTotal : shiftOpeningAmount;
      const shift = await api.openShift({
        pin,
        openingAmount: amount,
        openingCashCount: Object.keys(shiftOpeningCashCount).length > 0 ? shiftOpeningCashCount : undefined,
        notes: shiftNotes || undefined,
      });
      setActiveShift(shift);
      setShowOpenShiftModal(false);
      setShiftOpeningAmount(0);
      setShiftOpeningCashCount({});
      setShiftNotes('');
    } catch (err: any) {
      setShiftError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setShiftProcessing(false);
    }
  };

  const handleCloseShift = async () => {
    if (!activeShift) return;
    setShiftProcessing(true);
    setShiftError('');
    try {
      const cashCountTotal = DENOMINATIONS.reduce((sum, d) => sum + (shiftClosingCashCount[String(d)] || 0) * d, 0);
      const amount = cashCountTotal > 0 ? cashCountTotal : shiftClosingAmount;
      await api.closeShift(activeShift.id, {
        closingAmount: amount,
        closingCashCount: Object.keys(shiftClosingCashCount).length > 0 ? shiftClosingCashCount : undefined,
        notes: shiftNotes || undefined,
      });
      setShowCloseShiftModal(false);
      setActiveShift(null);
      setShiftClosingAmount(0);
      setShiftClosingCashCount({});
      setShiftNotes('');
      handleLogout();
    } catch (err: any) {
      setShiftError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setShiftProcessing(false);
    }
  };

  const prepareCloseShift = async () => {
    if (!activeShift) return;
    try {
      const summaryData = await api.getShiftSummary(activeShift.id);
      setShiftSummaryData(summaryData);
      setShiftError('');
      setShiftNotes('');
      setShiftClosingAmount(0);
      setShiftClosingCashCount({});
      setShowCloseShiftModal(true);
    } catch (err) {
      console.error('Failed to load shift summary:', err);
    }
  };

  // ===== Summary Refresh =====

  const loadSummary = useCallback(async () => {
    try {
      const summaryData = await api.getPaymentSummary();
      setSummary(summaryData);
    } catch (err) {
      console.error('Failed to load summary:', err);
    }
  }, []);

  useEffect(() => {
    if (!cashierName) return;
    loadSummary();
    const interval = setInterval(loadSummary, 15000);
    return () => clearInterval(interval);
  }, [cashierName, loadSummary]);

  // ===== Navigation Handlers =====

  const handleSelectTable = async (table: SelectedTable) => {
    setSelectedTable(table);

    if (table.status === 'AVAILABLE') {
      setCurrentSession(null);
      setCurrentView('session-form');
    } else {
      // For occupied/billing tables, fetch active session and go to order status
      try {
        const session = await api.getActiveTableSession(table.id);
        setCurrentSession(session);
      } catch {
        setCurrentSession(null);
      }
      setCurrentView('order-status');
    }
  };

  const handleSessionOpened = (session: TableSession) => {
    setCurrentSession(session);
    setCurrentView('menu-order');
  };

  const handleOrderSent = () => {
    // Stay on menu order view so they can add more items
  };

  const handleGoToPayment = () => {
    setCurrentView('payment');
  };

  const handlePaymentComplete = (payment: Payment, mergedOrders?: any[] | null) => {
    setReceiptPayment(payment);
    setReceiptMergedOrders(mergedOrders || null);

    // Close session and update table status
    if (selectedTable) {
      api.closeTableSession(selectedTable.id).catch(() => {});
      api.updateTableStatus(selectedTable.id, 'CLEANING').catch(() => {});
    }

    setSelectedTable(null);
    setCurrentSession(null);
    setCurrentView('floor-plan');
    loadSummary();
  };

  const handleTransferTable = async (toTableId: number) => {
    if (!selectedTable) return;
    await api.transferTable(selectedTable.id, {
      toTableId,
      performedBy: cashierName ?? undefined,
    });
    setSelectedTable(null);
    setCurrentSession(null);
    setCurrentView('floor-plan');
  };

  const handleBackToFloorPlan = () => {
    setSelectedTable(null);
    setCurrentSession(null);
    setCurrentView('floor-plan');
  };

  const handleViewChange = (view: POSView) => {
    if (view === 'floor-plan') {
      handleBackToFloorPlan();
    } else if (view === 'menu-order' && !selectedTable) {
      return;
    } else if (view === 'payment') {
      setCurrentView('payment');
    } else {
      setCurrentView(view);
    }
  };

  const handleLogout = () => {
    setCashierName(null);
    setSelectedTable(null);
    setCurrentSession(null);
    setActiveShift(null);
    setShiftSummaryData(null);
    setCurrentView('floor-plan');
  };

  // ===== Render =====

  if (!cashierName) {
    return <PinLogin onLogin={setCashierName} />;
  }

  const headerView: POSView =
    currentView === 'session-form' || currentView === 'order-status'
      ? 'floor-plan'
      : currentView;

  const renderCurrentView = () => {
    switch (currentView) {
      case 'floor-plan':
        return <POSFloorPlan onSelectTable={handleSelectTable} />;

      case 'session-form':
        return selectedTable ? (
          <POSTableSession
            table={selectedTable}
            cashierName={cashierName}
            onSessionOpened={handleSessionOpened}
            onBack={handleBackToFloorPlan}
          />
        ) : null;

      case 'menu-order':
        return selectedTable ? (
          <POSMenuOrder
            tableNumber={selectedTable.number}
            tableId={selectedTable.id}
            sessionId={currentSession?.id}
            cashierName={cashierName}
            onOrderSent={handleOrderSent}
            onGoToPayment={handleGoToPayment}
          />
        ) : null;

      case 'order-status':
        return selectedTable ? (
          <POSOrderStatus
            branchId={params.branchId}
            tableId={selectedTable.id}
            tableNumber={selectedTable.number}
            session={currentSession}
            onAddMore={() => setCurrentView('menu-order')}
            onPayment={handleGoToPayment}
            onTransferTable={handleTransferTable}
          />
        ) : null;

      case 'payment':
        return (
          <POSPayment
            branchId={params.branchId}
            tableNumber={selectedTable?.number}
            cashierName={cashierName}
            activeShift={activeShift}
            onPaymentComplete={handlePaymentComplete}
            onBack={() => {
              if (selectedTable) {
                setCurrentView('order-status');
              } else {
                setCurrentView('floor-plan');
              }
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <POSHeader
        cashierName={cashierName}
        activeShift={activeShift}
        summary={summary}
        currentView={headerView}
        selectedTableNumber={selectedTable?.number}
        onViewChange={handleViewChange}
        onShowHistory={() => setShowHistory(true)}
        onCloseShift={prepareCloseShift}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col print:hidden overflow-hidden">
        {renderCurrentView()}
      </div>

      {/* Receipt Modal */}
      {receiptPayment && (
        <POSReceipt
          payment={receiptPayment}
          mergedOrders={receiptMergedOrders}
          onClose={() => {
            setReceiptPayment(null);
            setReceiptMergedOrders(null);
          }}
        />
      )}

      {/* History Modal */}
      {showHistory && (
        <POSHistory
          onClose={() => setShowHistory(false)}
          onViewReceipt={(payment) => {
            setShowHistory(false);
            setReceiptPayment(payment);
          }}
        />
      )}

      {/* Open Shift Modal */}
      {showOpenShiftModal && (
        <OpenShiftModal
          onOpenShift={handleOpenShiftWithPin}
          onSkip={() => setShowOpenShiftModal(false)}
          openingAmount={shiftOpeningAmount}
          onOpeningAmountChange={setShiftOpeningAmount}
          openingCashCount={shiftOpeningCashCount}
          onOpeningCashCountChange={setShiftOpeningCashCount}
          notes={shiftNotes}
          onNotesChange={setShiftNotes}
          error={shiftError}
          processing={shiftProcessing}
        />
      )}

      {/* Close Shift Modal */}
      {showCloseShiftModal && activeShift && shiftSummaryData && (
        <CloseShiftModal
          shift={activeShift}
          summary={shiftSummaryData}
          onClose={() => setShowCloseShiftModal(false)}
          onCloseShift={handleCloseShift}
          closingAmount={shiftClosingAmount}
          onClosingAmountChange={setShiftClosingAmount}
          closingCashCount={shiftClosingCashCount}
          onClosingCashCountChange={setShiftClosingCashCount}
          notes={shiftNotes}
          onNotesChange={setShiftNotes}
          error={shiftError}
          processing={shiftProcessing}
        />
      )}
    </div>
  );
}
