'use client';

import KDSTimer from './KDSTimer';

interface KDSOrderCardProps {
  order: any;
  alertTimeout: number;
  onBumpItem: (orderId: number, itemId: number) => void;
  onBumpAll: (orderId: number) => void;
  isSelected?: boolean;
}

export default function KDSOrderCard({ order, alertTimeout, onBumpItem, onBumpAll, isSelected }: KDSOrderCardProps) {
  const pendingItems = order.items?.filter((i: any) => i.status !== 'COMPLETED') || [];
  const completedItems = order.items?.filter((i: any) => i.status === 'COMPLETED') || [];
  const allCompleted = pendingItems.length === 0;

  return (
    <div className={`rounded-xl border-2 overflow-hidden transition-all ${
      allCompleted
        ? 'border-green-300 bg-green-50'
        : isSelected
        ? 'border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-300'
        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
    }`}>
      {/* Header */}
      <div className={`px-3 py-2 flex items-center justify-between ${
        allCompleted ? 'bg-green-100' : 'bg-gray-50'
      }`}>
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm">{order.orderId}</span>
          {order.tableNumber && (
            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
              {order.tableNumber}
            </span>
          )}
        </div>
        <KDSTimer createdAt={order.createdAt} alertTimeout={alertTimeout} />
      </div>

      {/* Items */}
      <div className="p-2 space-y-1">
        {pendingItems.map((item: any) => (
          <div key={item.id} className="flex items-center justify-between p-1.5 rounded-lg hover:bg-gray-50 group">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-600 text-white rounded-full text-xs font-bold">
                  {item.quantity}
                </span>
                <span className="text-sm font-medium truncate">{item.menuItem?.name || 'Unknown'}</span>
              </div>
              {item.specialInstructions && (
                <p className="text-xs text-amber-600 mt-0.5 ml-7">* {item.specialInstructions}</p>
              )}
            </div>
            <button
              onClick={() => onBumpItem(order.id, item.id)}
              className="ml-2 px-2 py-1 bg-green-600 text-white rounded-lg text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity hover:bg-green-700"
            >
              Done
            </button>
          </div>
        ))}

        {completedItems.length > 0 && (
          <div className="pt-1 border-t border-gray-100">
            {completedItems.map((item: any) => (
              <div key={item.id} className="flex items-center gap-2 p-1 text-gray-400 line-through">
                <span className="w-5 h-5 flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span className="text-xs">{item.quantity}x {item.menuItem?.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bump All Button */}
      {!allCompleted && pendingItems.length > 1 && (
        <div className="px-2 pb-2">
          <button
            onClick={() => onBumpAll(order.id)}
            className="w-full py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition"
          >
            BUMP ALL
          </button>
        </div>
      )}
    </div>
  );
}
