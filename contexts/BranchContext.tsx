'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Branch {
  id: number;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  isActive: boolean;
}

interface BranchContextType {
  branches: Branch[];
  selectedBranch: Branch | null;
  setSelectedBranch: (branch: Branch) => void;
  loading: boolean;
  refetchBranches: () => Promise<void>;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

const getApiBaseUrl = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api';
  if (typeof window !== 'undefined') {
    try {
      const { port, pathname } = new URL(apiUrl);
      return `${window.location.protocol}//${window.location.hostname}:${port}${pathname}`;
    } catch {
      return apiUrl;
    }
  }
  return apiUrl;
};

export function BranchProvider({ children }: { children: ReactNode }) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranchState] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBranches = async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/branches`);
      if (res.ok) {
        const data: Branch[] = await res.json();
        setBranches(data);

        // Restore saved branch from localStorage
        const savedId = localStorage.getItem('selectedBranchId');
        const savedBranch = savedId ? data.find(b => b.id === parseInt(savedId)) : null;

        if (savedBranch) {
          setSelectedBranchState(savedBranch);
        } else if (data.length > 0) {
          setSelectedBranchState(data[0]);
          localStorage.setItem('selectedBranchId', String(data[0].id));
        }
      }
    } catch (err) {
      console.error('Failed to fetch branches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const setSelectedBranch = (branch: Branch) => {
    setSelectedBranchState(branch);
    localStorage.setItem('selectedBranchId', String(branch.id));
  };

  return (
    <BranchContext.Provider value={{
      branches,
      selectedBranch,
      setSelectedBranch,
      loading,
      refetchBranches: fetchBranches,
    }}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const context = useContext(BranchContext);
  if (context === undefined) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
}
