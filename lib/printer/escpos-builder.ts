import * as CMD from './escpos-commands';
import { encodeText, SET_THAI_CODEPAGE } from './thai-encoding';

export class ESCPOSBuilder {
  private parts: Uint8Array[] = [];
  private paperWidth: number;

  constructor(paperWidth = 48) {
    this.paperWidth = paperWidth; // characters per line (48 for 80mm, 32 for 58mm)
  }

  private append(data: Uint8Array): this {
    this.parts.push(data);
    return this;
  }

  init(): this {
    return this.append(CMD.INIT).append(SET_THAI_CODEPAGE);
  }

  // Text formatting
  bold(on = true): this {
    return this.append(on ? CMD.BOLD_ON : CMD.BOLD_OFF);
  }

  underline(on = true): this {
    return this.append(on ? CMD.UNDERLINE_ON : CMD.UNDERLINE_OFF);
  }

  alignLeft(): this {
    return this.append(CMD.ALIGN_LEFT);
  }

  alignCenter(): this {
    return this.append(CMD.ALIGN_CENTER);
  }

  alignRight(): this {
    return this.append(CMD.ALIGN_RIGHT);
  }

  textNormal(): this {
    return this.append(CMD.TEXT_NORMAL);
  }

  textDouble(): this {
    return this.append(CMD.TEXT_DOUBLE);
  }

  textDoubleHeight(): this {
    return this.append(CMD.TEXT_DOUBLE_HEIGHT);
  }

  textDoubleWidth(): this {
    return this.append(CMD.TEXT_DOUBLE_WIDTH);
  }

  // Print text
  text(content: string): this {
    return this.append(encodeText(content));
  }

  // Print text + newline
  line(content: string): this {
    return this.text(content).feed();
  }

  // Empty line
  feed(lines = 1): this {
    if (lines === 1) {
      return this.append(CMD.FEED_LINE);
    }
    return this.append(CMD.FEED_LINES(lines));
  }

  // Print two columns (left-aligned text + right-aligned text)
  columns(left: string, right: string): this {
    const space = this.paperWidth - this.visualLength(left) - this.visualLength(right);
    const padding = space > 0 ? ' '.repeat(space) : ' ';
    return this.line(left + padding + right);
  }

  // Print three columns
  threeColumns(left: string, center: string, right: string): this {
    const totalContent = this.visualLength(left) + this.visualLength(center) + this.visualLength(right);
    const totalSpace = this.paperWidth - totalContent;
    const leftPad = Math.floor(totalSpace / 2);
    const rightPad = totalSpace - leftPad;
    return this.line(
      left + (leftPad > 0 ? ' '.repeat(leftPad) : ' ') +
      center + (rightPad > 0 ? ' '.repeat(rightPad) : ' ') +
      right
    );
  }

  // Separator line
  separator(char = CMD.SEPARATOR_CHAR): this {
    return this.line(char.repeat(this.paperWidth));
  }

  // Dashed separator
  dashedSeparator(): this {
    return this.separator('-');
  }

  // QR Code
  qrCode(data: string): this {
    return this.append(CMD.qrCodeCommands(data));
  }

  // Barcode
  barcode(data: string): this {
    return this.append(CMD.barcodeCode128(data));
  }

  // Cut paper
  cut(partial = true): this {
    return this.feed(3).append(partial ? CMD.CUT_PARTIAL : CMD.CUT_FULL);
  }

  // Open cash drawer
  openDrawer(pin: 'pin2' | 'pin5' = 'pin2'): this {
    return this.append(pin === 'pin2' ? CMD.OPEN_DRAWER_PIN2 : CMD.OPEN_DRAWER_PIN5);
  }

  // Build final Uint8Array
  build(): Uint8Array {
    const totalLength = this.parts.reduce((sum, p) => sum + p.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const part of this.parts) {
      result.set(part, offset);
      offset += part.length;
    }
    return result;
  }

  // Helper: visual length accounting for Thai characters (each = 1 column)
  private visualLength(str: string): number {
    // Thai combining characters don't take extra space
    let len = 0;
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      // Skip Thai combining vowels and tone marks
      if (
        (code >= 0x0e31 && code <= 0x0e3a) ||
        (code >= 0x0e47 && code <= 0x0e4e)
      ) {
        continue;
      }
      len++;
    }
    return len;
  }
}
