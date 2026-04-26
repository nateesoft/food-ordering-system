'use client';

import { useEffect, useCallback } from 'react';
import { getSocket } from '../socket';

interface UseOrderUpdatesOptions {
  onOrderCreated?: (order: any) => void;
  onOrderStatusChanged?: (order: any) => void;
  onOrderCancelled?: (order: any) => void;
  onItemStatusChanged?: (data: any) => void;
}

export function useOrderUpdates(options: UseOrderUpdatesOptions) {
  const { onOrderCreated, onOrderStatusChanged, onOrderCancelled, onItemStatusChanged } = options;

  useEffect(() => {
    const socket = getSocket();
    if (!socket.connected) socket.connect();

    socket.emit('subscribe:orders');

    if (onOrderCreated) socket.on('order:created', onOrderCreated);
    if (onOrderStatusChanged) socket.on('order:statusChanged', onOrderStatusChanged);
    if (onOrderCancelled) socket.on('order:cancelled', onOrderCancelled);
    if (onItemStatusChanged) socket.on('order:itemStatusChanged', onItemStatusChanged);

    return () => {
      socket.emit('unsubscribe:orders');
      if (onOrderCreated) socket.off('order:created', onOrderCreated);
      if (onOrderStatusChanged) socket.off('order:statusChanged', onOrderStatusChanged);
      if (onOrderCancelled) socket.off('order:cancelled', onOrderCancelled);
      if (onItemStatusChanged) socket.off('order:itemStatusChanged', onItemStatusChanged);
    };
  }, [onOrderCreated, onOrderStatusChanged, onOrderCancelled, onItemStatusChanged]);
}
