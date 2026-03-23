// ESC/POS Command Constants for Thermal Receipt Printers

export const ESC = 0x1b;
export const GS = 0x1d;
export const LF = 0x0a;
export const CR = 0x0d;

// Initialize
export const INIT = new Uint8Array([ESC, 0x40]); // ESC @

// Text formatting
export const BOLD_ON = new Uint8Array([ESC, 0x45, 0x01]); // ESC E 1
export const BOLD_OFF = new Uint8Array([ESC, 0x45, 0x00]); // ESC E 0
export const UNDERLINE_ON = new Uint8Array([ESC, 0x2d, 0x01]); // ESC - 1
export const UNDERLINE_OFF = new Uint8Array([ESC, 0x2d, 0x00]); // ESC - 0

// Text alignment
export const ALIGN_LEFT = new Uint8Array([ESC, 0x61, 0x00]); // ESC a 0
export const ALIGN_CENTER = new Uint8Array([ESC, 0x61, 0x01]); // ESC a 1
export const ALIGN_RIGHT = new Uint8Array([ESC, 0x61, 0x02]); // ESC a 2

// Text size (GS ! n) - n encodes width and height multipliers
export const TEXT_NORMAL = new Uint8Array([GS, 0x21, 0x00]); // 1x width, 1x height
export const TEXT_DOUBLE_HEIGHT = new Uint8Array([GS, 0x21, 0x01]); // 1x width, 2x height
export const TEXT_DOUBLE_WIDTH = new Uint8Array([GS, 0x21, 0x10]); // 2x width, 1x height
export const TEXT_DOUBLE = new Uint8Array([GS, 0x21, 0x11]); // 2x width, 2x height

// Line feed
export const FEED_LINE = new Uint8Array([LF]);
export const FEED_LINES = (n: number) => new Uint8Array([ESC, 0x64, n]); // ESC d n

// Cut paper
export const CUT_FULL = new Uint8Array([GS, 0x56, 0x00]); // GS V 0
export const CUT_PARTIAL = new Uint8Array([GS, 0x56, 0x01]); // GS V 1
export const CUT_FEED_AND_CUT = new Uint8Array([GS, 0x56, 0x42, 0x03]); // GS V B 3

// Cash drawer
export const OPEN_DRAWER_PIN2 = new Uint8Array([ESC, 0x70, 0x00, 0x19, 0xfa]); // ESC p 0 25 250
export const OPEN_DRAWER_PIN5 = new Uint8Array([ESC, 0x70, 0x01, 0x19, 0xfa]); // ESC p 1 25 250

// Horizontal line separator
export const SEPARATOR_CHAR = '-';

// QR Code commands (GS ( k)
export function qrCodeCommands(data: string): Uint8Array {
  const encoder = new TextEncoder();
  const encoded = encoder.encode(data);
  const len = encoded.length + 3;
  const pL = len & 0xff;
  const pH = (len >> 8) & 0xff;

  const parts: Uint8Array[] = [
    // Set QR model 2
    new Uint8Array([GS, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00]),
    // Set QR size (module size = 6)
    new Uint8Array([GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, 0x06]),
    // Set error correction level L
    new Uint8Array([GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x30]),
    // Store QR data
    new Uint8Array([GS, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30, ...encoded]),
    // Print QR
    new Uint8Array([GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30]),
  ];

  const totalLength = parts.reduce((sum, p) => sum + p.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

// Barcode commands
export function barcodeCode128(data: string): Uint8Array {
  const encoder = new TextEncoder();
  const encoded = encoder.encode(data);
  return new Uint8Array([
    GS, 0x68, 0x50,        // Set barcode height = 80
    GS, 0x77, 0x02,        // Set barcode width = 2
    GS, 0x48, 0x02,        // Print HRI below barcode
    GS, 0x6b, 0x49,        // Code128 type
    encoded.length,         // Data length
    ...encoded,
  ]);
}
