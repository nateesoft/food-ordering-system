'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Building2, ChevronDown, Check } from 'lucide-react';
import { useBranch } from '@/contexts/BranchContext';

export default function BranchSelector() {
  const { branches, selectedBranch, setSelectedBranch, loading } = useBranch();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg text-sm">
        <Building2 className="w-4 h-4" />
        <span>Loading...</span>
      </div>
    );
  }

  if (branches.length === 0) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
      >
        <Building2 className="w-4 h-4" />
        <span>{selectedBranch?.name || 'เลือกสาขา'}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border z-50 overflow-hidden">
          <div className="p-3 border-b bg-gray-50">
            <p className="text-xs font-semibold text-gray-500 uppercase">เลือกสาขา</p>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {branches.filter(b => b.isActive).map(branch => (
              <button
                key={branch.id}
                onClick={() => {
                  setSelectedBranch(branch);
                  setOpen(false);
                  window.location.reload();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-indigo-50 transition-colors ${
                  selectedBranch?.id === branch.id ? 'bg-indigo-50' : ''
                }`}
              >
                <Building2 className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{branch.name}</p>
                  <p className="text-xs text-gray-500">{branch.code}</p>
                </div>
                {selectedBranch?.id === branch.id && (
                  <Check className="w-4 h-4 text-indigo-600" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
