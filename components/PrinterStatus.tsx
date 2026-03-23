'use client';

interface PrinterStatusProps {
  isConnected: boolean;
  isPrinting?: boolean;
  onClick?: () => void;
  showLabel?: boolean;
}

export default function PrinterStatus({ isConnected, isPrinting, onClick, showLabel = true }: PrinterStatusProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
        isConnected
          ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20'
          : 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20'
      }`}
      title={isConnected ? 'Printer connected' : 'Printer disconnected - Click to connect'}
    >
      {isPrinting ? (
        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
      )}
      <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
      {showLabel && (
        <span>{isPrinting ? 'Printing...' : isConnected ? 'Printer' : 'No Printer'}</span>
      )}
    </button>
  );
}
