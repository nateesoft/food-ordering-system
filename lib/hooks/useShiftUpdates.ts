'use client';

import { useEffect } from 'react';
import { getSocket } from '../socket';

interface UseShiftUpdatesOptions {
  onShiftOpened?: (shift: any) => void;
  onShiftClosed?: (shift: any) => void;
}

export function useShiftUpdates(options: UseShiftUpdatesOptions) {
  const { onShiftOpened, onShiftClosed } = options;

  useEffect(() => {
    const socket = getSocket();
    if (!socket.connected) socket.connect();

    socket.emit('subscribe:shifts');

    if (onShiftOpened) socket.on('shift:opened', onShiftOpened);
    if (onShiftClosed) socket.on('shift:closed', onShiftClosed);

    return () => {
      socket.emit('unsubscribe:shifts');
      if (onShiftOpened) socket.off('shift:opened', onShiftOpened);
      if (onShiftClosed) socket.off('shift:closed', onShiftClosed);
    };
  }, [onShiftOpened, onShiftClosed]);
}
