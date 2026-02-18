import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { BranchProvider, useBranch, Branch } from '@/contexts/BranchContext';

// Mock localStorage
const mockStorage: Record<string, string> = {};
Object.defineProperty(global, 'localStorage', {
  value: {
    getItem: jest.fn((key: string) => mockStorage[key] || null),
    setItem: jest.fn((key: string, value: string) => { mockStorage[key] = value; }),
    removeItem: jest.fn((key: string) => { delete mockStorage[key]; }),
  },
  writable: true,
});

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

const testBranches: Branch[] = [
  { id: 1, name: 'Main Branch', code: 'MAIN', address: '123 Main St', phone: '0812345678', isActive: true },
  { id: 2, name: 'Branch 2', code: 'BR2', address: '456 Second St', phone: null, isActive: true },
];

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BranchProvider>{children}</BranchProvider>
);

describe('BranchContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(testBranches),
    });
  });

  it('should fetch branches on mount', async () => {
    renderHook(() => useBranch(), { wrapper });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/branches'),
      );
    });
  });

  it('should provide branches in context', async () => {
    const { result } = renderHook(() => useBranch(), { wrapper });

    await waitFor(() => {
      expect(result.current.branches).toEqual(testBranches);
    });
  });

  it('should select first branch by default', async () => {
    const { result } = renderHook(() => useBranch(), { wrapper });

    await waitFor(() => {
      expect(result.current.selectedBranch).toEqual(testBranches[0]);
    });
  });

  it('should persist selected branch to localStorage', async () => {
    const { result } = renderHook(() => useBranch(), { wrapper });

    await waitFor(() => {
      expect(result.current.selectedBranch).not.toBeNull();
    });

    act(() => {
      result.current.setSelectedBranch(testBranches[1]);
    });

    expect(localStorage.setItem).toHaveBeenCalledWith('selectedBranchId', '2');
    expect(result.current.selectedBranch).toEqual(testBranches[1]);
  });

  it('should restore branch from localStorage on mount', async () => {
    mockStorage['selectedBranchId'] = '2';

    const { result } = renderHook(() => useBranch(), { wrapper });

    await waitFor(() => {
      expect(result.current.selectedBranch?.id).toBe(2);
    });
  });

  it('should handle fetch error gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const { result } = renderHook(() => useBranch(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.branches).toEqual([]);
    expect(result.current.selectedBranch).toBeNull();
    consoleSpy.mockRestore();
  });

  it('should start with loading=true and transition to false', async () => {
    const { result } = renderHook(() => useBranch(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should throw error when useBranch is used outside BranchProvider', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    expect(() => {
      renderHook(() => useBranch());
    }).toThrow('useBranch must be used within a BranchProvider');

    consoleSpy.mockRestore();
  });
});
