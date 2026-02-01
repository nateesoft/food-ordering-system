'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, UserCheck, LogOut, Loader2, Shield } from 'lucide-react';
import { api, StaffInfo } from '../lib/api';

interface StaffCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableNumber: string;
  onCheckInSuccess: (staffInfo: StaffInfo, pin: string) => void;
  onCheckOutSuccess: () => void;
  currentStaff: StaffInfo | null;
}

export default function StaffCheckInModal({
  isOpen,
  onClose,
  tableNumber,
  onCheckInSuccess,
  onCheckOutSuccess,
  currentStaff,
}: StaffCheckInModalProps) {
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'check-in' | 'check-out'>('check-in');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(null);
      setMode(currentStaff ? 'check-out' : 'check-in');
      // Focus input after modal opens
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, currentStaff]);

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setPin(value);
    setError(null);
  };

  const handleCheckIn = async () => {
    if (pin.length < 4) {
      setError('กรุณากรอก PIN อย่างน้อย 4 หลัก');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.staffCheckIn({ pin, tableNumber });
      const staffInfo: StaffInfo = {
        id: response.assignment.user.id,
        name: response.assignment.user.name,
        role: response.assignment.user.role,
        checkedInAt: response.assignment.checkedInAt,
        lastSeenAt: response.assignment.lastSeenAt,
      };
      onCheckInSuccess(staffInfo, pin);
      onClose();
    } catch (err) {
      setError('PIN ไม่ถูกต้อง หรือบัญชีถูกระงับ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (pin.length < 4) {
      setError('กรุณากรอก PIN เพื่อยืนยันการออก');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await api.staffCheckOut({ pin, tableNumber });
      onCheckOutSuccess();
      onClose();
    } catch (err) {
      setError('PIN ไม่ถูกต้อง');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'check-in') {
      handleCheckIn();
    } else {
      handleCheckOut();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
        {/* Header */}
        <div className={`p-4 rounded-t-2xl ${mode === 'check-in' ? 'bg-green-500' : 'bg-orange-500'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                {mode === 'check-in' ? (
                  <UserCheck className="w-5 h-5 text-white" />
                ) : (
                  <LogOut className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  {mode === 'check-in' ? 'Staff Check-in' : 'Staff Check-out'}
                </h2>
                <p className="text-white/80 text-sm">โต๊ะ {tableNumber}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {currentStaff && mode === 'check-out' && (
            <div className="mb-4 p-3 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500">พนักงานปัจจุบัน</p>
              <p className="font-semibold text-gray-800">{currentStaff.name}</p>
              <p className="text-xs text-gray-400">
                Check-in เมื่อ {new Date(currentStaff.checkedInAt).toLocaleTimeString('th-TH')}
              </p>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Shield className="w-4 h-4 inline mr-1" />
              กรอกรหัส PIN
            </label>
            <input
              ref={inputRef}
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              value={pin}
              onChange={handlePinChange}
              placeholder="••••••"
              className="w-full text-center text-3xl tracking-[0.5em] py-4 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-0 outline-none transition-colors"
              maxLength={6}
              autoComplete="off"
            />
            <p className="text-xs text-gray-400 mt-2 text-center">PIN 4-6 หลัก</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600 text-center">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || pin.length < 4}
            className={`w-full py-4 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2
              ${mode === 'check-in'
                ? 'bg-green-500 hover:bg-green-600 disabled:bg-green-300'
                : 'bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300'
              }
              ${isLoading ? 'cursor-wait' : 'cursor-pointer'}
            `}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                กำลังดำเนินการ...
              </>
            ) : mode === 'check-in' ? (
              <>
                <UserCheck className="w-5 h-5" />
                เข้าดูแลโต๊ะนี้
              </>
            ) : (
              <>
                <LogOut className="w-5 h-5" />
                ออกจากการดูแล
              </>
            )}
          </button>

          {currentStaff && (
            <button
              type="button"
              onClick={() => setMode(mode === 'check-in' ? 'check-out' : 'check-in')}
              className="w-full mt-3 py-3 text-gray-500 hover:text-gray-700 text-sm"
            >
              {mode === 'check-out' ? 'เปลี่ยนเป็น Check-in พนักงานอื่น' : 'กลับไป Check-out'}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
