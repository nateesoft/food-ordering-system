'use client';

import React from 'react';
import { UserCheck, Clock } from 'lucide-react';
import { StaffInfo } from '../lib/api';

interface StaffBadgeProps {
  staff: StaffInfo;
  onClick?: () => void;
}

export default function StaffBadge({ staff, onClick }: StaffBadgeProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeSince = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'เมื่อสักครู่';
    if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;

    return formatTime(dateString);
  };

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-3 py-1.5 hover:bg-green-100 transition-colors"
    >
      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
        <UserCheck className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="text-left">
        <p className="text-sm font-medium text-green-800 leading-tight">{staff.name}</p>
        <p className="text-xs text-green-600 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {getTimeSince(staff.lastSeenAt)}
        </p>
      </div>
    </button>
  );
}
