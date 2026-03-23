'use client';

import { useEffect } from 'react';
import { getSocket } from '../socket';

interface UseKDSUpdatesOptions {
  onNewOrder?: (order: any) => void;
  onOrderStatusChanged?: (order: any) => void;
  onOrderCancelled?: (order: any) => void;
  onItemStatusChanged?: (data: any) => void;
}

export function useKDSUpdates(options: UseKDSUpdatesOptions) {
  const { onNewOrder, onOrderStatusChanged, onOrderCancelled, onItemStatusChanged } = options;

  useEffect(() => {
    const socket = getSocket();
    if (!socket.connected) socket.connect();

    socket.emit('subscribe:kds');

    if (onNewOrder) socket.on('kds:newOrder', onNewOrder);
    if (onOrderStatusChanged) socket.on('kds:orderStatusChanged', onOrderStatusChanged);
    if (onOrderCancelled) socket.on('kds:orderCancelled', onOrderCancelled);
    if (onItemStatusChanged) socket.on('kds:itemStatusChanged', onItemStatusChanged);

    return () => {
      socket.emit('unsubscribe:kds');
      if (onNewOrder) socket.off('kds:newOrder', onNewOrder);
      if (onOrderStatusChanged) socket.off('kds:orderStatusChanged', onOrderStatusChanged);
      if (onOrderCancelled) socket.off('kds:orderCancelled', onOrderCancelled);
      if (onItemStatusChanged) socket.off('kds:itemStatusChanged', onItemStatusChanged);
    };
  }, [onNewOrder, onOrderStatusChanged, onOrderCancelled, onItemStatusChanged]);
}
