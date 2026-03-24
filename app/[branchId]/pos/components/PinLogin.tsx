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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute top-20 -left-32 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-20 -right-32 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />

      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 w-full max-w-sm relative z-10">
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
              className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-xl font-bold transition-all duration-300 ${
                pin.length > i
                  ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 scale-110 shadow-md shadow-blue-500/20'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              {pin.length > i ? '●' : ''}
            </div>
          ))}
        </div>

        {error && (
          <div className="text-red-500 text-center text-sm mb-4 animate-fade-in">{error}</div>
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
                className={`h-14 rounded-xl text-xl font-semibold transition-all duration-200 ${
                  !key
                    ? 'invisible'
                    : key === 'DEL'
                    ? 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 hover:from-gray-200 hover:to-gray-300 shadow-md hover:shadow-lg active:shadow-sm active:scale-95'
                    : 'bg-gradient-to-br from-white to-gray-50 text-gray-800 hover:from-gray-50 hover:to-gray-100 shadow-md hover:shadow-lg active:shadow-sm active:scale-95'
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
