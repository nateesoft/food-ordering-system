'use client';

import { useEffect } from 'react';
import { getSocket } from '../socket';

interface UsePaymentUpdatesOptions {
  onPaymentCompleted?: (payment: any) => void;
  onPaymentRefunded?: (payment: any) => void;
}

export function usePaymentUpdates(options: UsePaymentUpdatesOptions) {
  const { onPaymentCompleted, onPaymentRefunded } = options;

  useEffect(() => {
    const socket = getSocket();
    if (!socket.connected) socket.connect();

    socket.emit('subscribe:payments');

    if (onPaymentCompleted) socket.on('payment:completed', onPaymentCompleted);
    if (onPaymentRefunded) socket.on('payment:refunded', onPaymentRefunded);

    return () => {
      socket.emit('unsubscribe:payments');
      if (onPaymentCompleted) socket.off('payment:completed', onPaymentCompleted);
      if (onPaymentRefunded) socket.off('payment:refunded', onPaymentRefunded);
    };
  }, [onPaymentCompleted, onPaymentRefunded]);
}
