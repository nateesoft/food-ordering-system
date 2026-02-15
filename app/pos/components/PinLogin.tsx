'use client';

import React, { useState, useEffect } from 'react';
import { DollarSign } from 'lucide-react';
import { api } from '@/lib/api';

interface PinLoginProps {
  onLogin: (name: string) => void;
}

export default function PinLogin({ onLogin }: PinLoginProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePinInput = (digit: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + digit);
      setError('');
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleSubmit = async () => {
    if (pin.length < 4) {
      setError('กรุณาใส่ PIN อย่างน้อย 4 หลัก');
      return;
    }

    setLoading(true);
    try {
      const result = await api.verifyStaffPin(pin);
      onLogin(result.staff.name);
    } catch {
      setError('PIN ไม่ถูกต้อง');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pin.length === 4) {
      handleSubmit();
    }
  }, [pin]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <DollarSign className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">POS System</h1>
          <p className="text-gray-500 mt-1">ใส่ PIN เพื่อเข้าสู่ระบบ</p>
        </div>

        {/* PIN Display */}
        <div className="flex justify-center gap-3 mb-6">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-xl font-bold ${
                pin.length > i
                  ? 'border-blue-500 bg-blue-50 text-blue-600'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              {pin.length > i ? '●' : ''}
            </div>
          ))}
        </div>

        {error && (
          <div className="text-red-500 text-center text-sm mb-4">{error}</div>
        )}

        {/* Number Pad */}
        <div className="grid grid-cols-3 gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'DEL'].map(
            (key) => (
              <button
                key={key || 'empty'}
                onClick={() => {
                  if (key === 'DEL') handleDelete();
                  else if (key) handlePinInput(key);
                }}
                disabled={loading || !key}
                className={`h-14 rounded-xl text-xl font-semibold transition-all ${
                  !key
                    ? 'invisible'
                    : key === 'DEL'
                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:scale-95'
                    : 'bg-gray-50 text-gray-800 hover:bg-gray-100 active:scale-95'
                }`}
              >
                {key === 'DEL' ? '⌫' : key}
              </button>
            )
          )}
        </div>

        {loading && (
          <div className="text-center mt-4 text-blue-600">กำลังตรวจสอบ...</div>
        )}
      </div>
    </div>
  );
}
