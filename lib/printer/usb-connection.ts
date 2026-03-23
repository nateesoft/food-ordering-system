// Web USB API fallback connection for ESC/POS printers
declare global {
  interface Navigator {
    usb: {
      requestDevice(options: any): Promise<any>;
    };
  }
}

export class USBConnection {
  private device: any = null;
  private interfaceNumber = 0;
  private endpointNumber = 1;
  private _isConnected = false;

  get isConnected(): boolean {
    return this._isConnected;
  }

  static isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'usb' in navigator;
  }

  async connect(): Promise<boolean> {
    if (!USBConnection.isSupported()) {
      throw new Error('Web USB API is not supported in this browser');
    }

    try {
      this.device = await navigator.usb.requestDevice({
        filters: [
          // Common thermal printer vendor IDs
          { vendorId: 0x0416 }, // Winbond (many Chinese printers)
          { vendorId: 0x0483 }, // STMicroelectronics
          { vendorId: 0x04b8 }, // Epson
          { vendorId: 0x0519 }, // Star Micronics
          { vendorId: 0x0dd4 }, // Custom Engineering
          { vendorId: 0x20d1 }, // Bixolon
        ],
      });

      await this.device.open();

      if (this.device.configuration === null) {
        await this.device.selectConfiguration(1);
      }

      // Find the right interface and endpoint
      const iface = this.device.configuration?.interfaces[0];
      if (iface) {
        this.interfaceNumber = iface.interfaceNumber;
        await this.device.claimInterface(this.interfaceNumber);

        const endpoint = iface.alternate.endpoints.find((e: any) => e.direction === 'out');
        if (endpoint) {
          this.endpointNumber = endpoint.endpointNumber;
        }
      }

      this._isConnected = true;
      return true;
    } catch (error) {
      this._isConnected = false;
      this.device = null;
      throw error;
    }
  }

  async write(data: Uint8Array): Promise<void> {
    if (!this.device || !this._isConnected) {
      throw new Error('Printer not connected via USB');
    }

    await this.device.transferOut(this.endpointNumber, data);
  }

  async disconnect(): Promise<void> {
    try {
      if (this.device) {
        await this.device.releaseInterface(this.interfaceNumber);
        await this.device.close();
      }
    } catch {
      // Ignore close errors
    } finally {
      this._isConnected = false;
      this.device = null;
    }
  }
}
