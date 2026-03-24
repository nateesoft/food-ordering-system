'use client';

import { useEffect } from 'react';
import { usePaymentGateway } from '@/lib/hooks/usePaymentGateway';
import PromptPayQR from './PromptPayQR';
import CreditCardForm from './CreditCardForm';

interface POSGatewayPaymentProps {
  amount: number;
  paymentMethod: string; // 'TRANSFER' or 'CREDIT_CARD'
  onCompleted: (transactionId: string) => void;
  onCancel: () => void;
}

export default function POSGatewayPayment({
  amount,
  paymentMethod,
  onCompleted,
  onCancel,
}: POSGatewayPaymentProps) {
  const gateway = usePaymentGateway();

  // Auto-initiate for PromptPay/Transfer
  useEffect(() => {
    if (paymentMethod === 'TRANSFER' && gateway.state === 'idle') {
      gateway.initiate(amount, paymentMethod);
    }
  }, [paymentMethod, amount, gateway.state]);

  // Notify parent on completion
  useEffect(() => {
    if (gateway.state === 'completed' && gateway.transactionId) {
      onCompleted(gateway.transactionId);
    }
  }, [gateway.state, gateway.transactionId, onCompleted]);

  const handleCreditCardSubmit = () => {
    gateway.initiate(amount, 'CREDIT_CARD');
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold text-gray-800">
            {paymentMethod === 'TRANSFER' ? 'ชำระผ่าน PromptPay' : 'ชำระด้วยบัตรเครดิต'}
          </h2>
          <button
            onClick={() => { gateway.reset(); onCancel(); }}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        {gateway.state === 'completed' ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-green-700 mb-2">ชำระเงินสำเร็จ!</h3>
            <p className="text-gray-500">Transaction: {gateway.transactionId}</p>
          </div>
        ) : gateway.state === 'failed' ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-red-700 mb-2">การชำระเงินล้มเหลว</h3>
            <p className="text-gray-500 mb-4">{gateway.error}</p>
            <button
              onClick={gateway.reset}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              ลองอีกครั้ง
            </button>
          </div>
        ) : paymentMethod === 'TRANSFER' ? (
          <>
            {gateway.state === 'awaiting' && gateway.qrCodeData && gateway.transactionId ? (
              <PromptPayQR
                amount={amount}
                qrData={gateway.qrCodeData}
                transactionId={gateway.transactionId}
              />
            ) : (
              <div className="p-8 text-center">
                <svg className="w-8 h-8 animate-spin mx-auto text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="mt-3 text-gray-500">กำลังสร้าง QR Code...</p>
              </div>
            )}
            {/* Simulate button (for testing) */}
            {gateway.state === 'awaiting' && (
              <div className="p-4 border-t bg-yellow-50">
                <button
                  onClick={gateway.simulateComplete}
                  className="w-full py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm font-medium"
                >
                  [TEST] จำลองการชำระเงินสำเร็จ
                </button>
              </div>
            )}
          </>
        ) : (
          <CreditCardForm
            amount={amount}
            onSubmit={handleCreditCardSubmit}
            isProcessing={gateway.state === 'initiating' || gateway.state === 'awaiting'}
          />
        )}
      </div>
    </div>
  );
}
