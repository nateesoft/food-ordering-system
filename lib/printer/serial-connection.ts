// Web Serial API connection manager for ESC/POS printers
// Web Serial API types (not in default lib.dom.d.ts)
declare global {
  interface Navigator {
    serial: {
      requestPort(options?: any): Promise<any>;
      getPorts(): Promise<any[]>;
    };
  }
}

export interface SerialConfig {
  baudRate: number;
  dataBits?: number;
  stopBits?: number;
  parity?: string;
}

const DEFAULT_CONFIG: SerialConfig = {
  baudRate: 9600,
  dataBits: 8,
  stopBits: 1,
  parity: 'none',
};

export class SerialConnection {
  private port: any = null;
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
  private _isConnected = false;

  get isConnected(): boolean {
    return this._isConnected;
  }

  static isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  async connect(config: Partial<SerialConfig> = {}): Promise<boolean> {
    if (!SerialConnection.isSupported()) {
      throw new Error('Web Serial API is not supported in this browser');
    }

    try {
      this.port = await navigator.serial.requestPort();
      await this.port.open({ ...DEFAULT_CONFIG, ...config });
      this._isConnected = true;
      return true;
    } catch (error) {
      this._isConnected = false;
      this.port = null;
      throw error;
    }
  }

  async reconnect(config: Partial<SerialConfig> = {}): Promise<boolean> {
    if (!SerialConnection.isSupported()) return false;

    try {
      const ports = await navigator.serial.getPorts();
      if (ports.length > 0) {
        this.port = ports[0];
        await this.port.open({ ...DEFAULT_CONFIG, ...config });
        this._isConnected = true;
        return true;
      }
    } catch {
      // Port might already be open or no previously granted port
    }
    return false;
  }

  async write(data: Uint8Array): Promise<void> {
    if (!this.port || !this._isConnected) {
      throw new Error('Printer not connected');
    }

    if (!this.port.writable) {
      throw new Error('Serial port is not writable');
    }

    const writer = this.port.writable.getWriter();
    try {
      await writer.write(data);
    } finally {
      writer.releaseLock();
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.writer) {
        await this.writer.close();
        this.writer = null;
      }
      if (this.port) {
        await this.port.close();
      }
    } catch {
      // Ignore close errors
    } finally {
      this._isConnected = false;
      this.port = null;
    }
  }
}
