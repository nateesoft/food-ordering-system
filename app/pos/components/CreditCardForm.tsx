'use client';

import { useState } from 'react';

interface CreditCardFormProps {
  amount: number;
  onSubmit: () => void;
  isProcessing: boolean;
}

function formatCardNumber(value: string): string {
  const cleaned = value.replace(/\D/g, '').slice(0, 16);
  return cleaned.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(value: string): string {
  const cleaned = value.replace(/\D/g, '').slice(0, 4);
  if (cleaned.length >= 3) {
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
  }
  return cleaned;
}

function luhnCheck(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length < 13) return false;
  let sum = 0;
  let alternate = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

export default function CreditCardForm({ amount, onSubmit, isProcessing }: CreditCardFormProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const cleanCard = cardNumber.replace(/\s/g, '');

    if (cleanCard.length < 13) {
      newErrors.cardNumber = 'กรุณากรอกหมายเลขบัตรให้ครบ';
    } else if (!luhnCheck(cleanCard)) {
      newErrors.cardNumber = 'หมายเลขบัตรไม่ถูกต้อง';
    }

    if (!cardName.trim()) {
      newErrors.cardName = 'กรุณากรอกชื่อบนบัตร';
    }

    const cleanExpiry = expiry.replace('/', '');
    if (cleanExpiry.length < 4) {
      newErrors.expiry = 'กรุณากรอก MM/YY';
    } else {
      const month = parseInt(cleanExpiry.slice(0, 2), 10);
      if (month < 1 || month > 12) {
        newErrors.expiry = 'เดือนไม่ถูกต้อง';
      }
    }

    if (cvv.length < 3) {
      newErrors.cvv = 'กรุณากรอก CVV';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      {/* Card Visual */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-5 text-white mb-6 shadow-xl">
        <div className="flex justify-between items-start mb-8">
          <div className="w-10 h-7 bg-yellow-400 rounded-sm" />
          <svg className="w-10 h-10 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="9" cy="12" r="7" opacity="0.6" />
            <circle cx="15" cy="12" r="7" opacity="0.4" />
          </svg>
        </div>
        <div className="text-lg tracking-widest font-mono mb-4">
          {cardNumber || '•••• •••• •••• ••••'}
        </div>
        <div className="flex justify-between text-sm">
          <span className="uppercase">{cardName || 'CARD HOLDER'}</span>
          <span>{expiry || 'MM/YY'}</span>
        </div>
      </div>

      {/* Card Number */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">หมายเลขบัตร</label>
        <input
          type="text"
          value={cardNumber}
          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
          placeholder="0000 0000 0000 0000"
          className={`w-full border rounded-lg px-3 py-2.5 text-sm font-mono ${
            errors.cardNumber ? 'border-red-500' : 'border-gray-300'
          }`}
          maxLength={19}
        />
        {errors.cardNumber && <p className="text-xs text-red-500 mt-1">{errors.cardNumber}</p>}
      </div>

      {/* Card Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อบนบัตร</label>
        <input
          type="text"
          value={cardName}
          onChange={(e) => setCardName(e.target.value.toUpperCase())}
          placeholder="JOHN DOE"
          className={`w-full border rounded-lg px-3 py-2.5 text-sm uppercase ${
            errors.cardName ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.cardName && <p className="text-xs text-red-500 mt-1">{errors.cardName}</p>}
      </div>

      {/* Expiry + CVV */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">วันหมดอายุ</label>
          <input
            type="text"
            value={expiry}
            onChange={(e) => setExpiry(formatExpiry(e.target.value))}
            placeholder="MM/YY"
            className={`w-full border rounded-lg px-3 py-2.5 text-sm font-mono ${
              errors.expiry ? 'border-red-500' : 'border-gray-300'
            }`}
            maxLength={5}
          />
          {errors.expiry && <p className="text-xs text-red-500 mt-1">{errors.expiry}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
          <input
            type="password"
            value={cvv}
            onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="•••"
            className={`w-full border rounded-lg px-3 py-2.5 text-sm font-mono ${
              errors.cvv ? 'border-red-500' : 'border-gray-300'
            }`}
            maxLength={4}
          />
          {errors.cvv && <p className="text-xs text-red-500 mt-1">{errors.cvv}</p>}
        </div>
      </div>

      {/* Amount */}
      <div className="bg-gray-50 rounded-lg p-3 flex justify-between items-center">
        <span className="text-gray-600">ยอดชำระ</span>
        <span className="text-xl font-bold">฿{amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isProcessing}
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>กำลังดำเนินการ...</span>
          </>
        ) : (
          <span>ชำระเงิน ฿{amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
        )}
      </button>

      {/* Mock notice */}
      <p className="text-xs text-center text-gray-400">
        (Simulation Mode - ไม่มีการเรียกเก็บเงินจริง)
      </p>
    </form>
  );
}
