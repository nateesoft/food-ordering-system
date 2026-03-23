// UTF-8 Thai to TIS-620 encoding conversion
// TIS-620 maps Thai characters (U+0E01 - U+0E5B) to bytes 0xA1 - 0xFB

const THAI_RANGE_START = 0x0e01;
const THAI_RANGE_END = 0x0e5b;
const TIS620_OFFSET = 0x0e01 - 0xa1;

export function utf8ToTis620(text: string): Uint8Array {
  const bytes: number[] = [];

  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);

    if (code >= THAI_RANGE_START && code <= THAI_RANGE_END) {
      // Thai character -> TIS-620
      bytes.push(code - TIS620_OFFSET);
    } else if (code < 0x80) {
      // ASCII
      bytes.push(code);
    } else {
      // Non-Thai, non-ASCII -> replace with '?'
      bytes.push(0x3f);
    }
  }

  return new Uint8Array(bytes);
}

export function encodeText(text: string, useThaiEncoding = true): Uint8Array {
  if (useThaiEncoding) {
    return utf8ToTis620(text);
  }
  return new TextEncoder().encode(text);
}

// Set Thai code page (CP874 / TIS-620)
export const SET_THAI_CODEPAGE = new Uint8Array([0x1b, 0x74, 0x15]); // ESC t 21
