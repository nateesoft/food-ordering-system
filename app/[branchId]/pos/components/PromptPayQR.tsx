'use client';

import { useEffect, useRef } from 'react';

interface PromptPayQRProps {
  amount: number;
  qrData: string;
  transactionId: string;
}

export default function PromptPayQR({ amount, qrData, transactionId }: PromptPayQRProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !qrData) return;

    // Use the qrcode library that's already installed
    import('qrcode').then((QRCode) => {
      QRCode.toCanvas(canvasRef.current, qrData, {
        width: 256,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' },
      });
    }).catch(() => {
      // Fallback: display text
    });
  }, [qrData]);

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      {/* PromptPay Logo */}
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
          P
        </div>
        <span className="text-xl font-bold text-blue-700">PromptPay</span>
      </div>

      {/* QR Code */}
      <div className="bg-white p-4 rounded-xl border-2 border-blue-200 shadow-lg">
        <canvas ref={canvasRef} />
      </div>

      {/* Amount */}
      <div className="text-center">
        <p className="text-sm text-gray-500">จำนวนเงินที่ต้องชำระ</p>
        <p className="text-3xl font-bold text-gray-900">
          ฿{amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
        </p>
      </div>

      {/* Transaction ID */}
      <p className="text-xs text-gray-400">Ref: {transactionId}</p>

      {/* Instructions */}
      <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700 text-center max-w-xs">
        <p>สแกน QR Code ด้วยแอปธนาคาร</p>
        <p className="text-xs mt-1">ระบบจะตรวจสอบการชำระเงินอัตโนมัติ</p>
      </div>

      {/* Loading indicator */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span>รอการชำระเงิน...</span>
      </div>
    </div>
  );
}
