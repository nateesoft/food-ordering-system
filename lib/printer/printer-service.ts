import { SerialConnection, type SerialConfig } from './serial-connection';
import { USBConnection } from './usb-connection';
import { formatReceipt, formatTaxInvoiceReceipt, type ReceiptData } from './receipt-formatter';
import { ESCPOSBuilder } from './escpos-builder';

export type ConnectionType = 'serial' | 'usb';

export interface PrinterServiceConfig {
  connectionType: ConnectionType;
  serialConfig?: Partial<SerialConfig>;
  paperWidth?: number;
  shopName?: string;
  shopAddress?: string;
  shopPhone?: string;
  shopTaxId?: string;
  footerText?: string;
}

const DEFAULT_PRINTER_CONFIG: PrinterServiceConfig = {
  connectionType: 'serial',
  serialConfig: { baudRate: 9600 },
  paperWidth: 48,
  shopName: 'ร้านอาหาร',
};

export class PrinterService {
  private serialConnection: SerialConnection | null = null;
  private usbConnection: USBConnection | null = null;
  private config: PrinterServiceConfig;

  constructor(config: Partial<PrinterServiceConfig> = {}) {
    this.config = { ...DEFAULT_PRINTER_CONFIG, ...config };
  }

  updateConfig(config: Partial<PrinterServiceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  get isConnected(): boolean {
    if (this.config.connectionType === 'serial') {
      return this.serialConnection?.isConnected ?? false;
    }
    return this.usbConnection?.isConnected ?? false;
  }

  get connectionType(): ConnectionType {
    return this.config.connectionType;
  }

  static getSupportedConnections(): ConnectionType[] {
    const supported: ConnectionType[] = [];
    if (SerialConnection.isSupported()) supported.push('serial');
    if (USBConnection.isSupported()) supported.push('usb');
    return supported;
  }

  async connect(): Promise<boolean> {
    if (this.config.connectionType === 'serial') {
      this.serialConnection = new SerialConnection();
      return this.serialConnection.connect(this.config.serialConfig);
    } else {
      this.usbConnection = new USBConnection();
      return this.usbConnection.connect();
    }
  }

  async reconnect(): Promise<boolean> {
    if (this.config.connectionType === 'serial' && this.serialConnection) {
      return this.serialConnection.reconnect(this.config.serialConfig);
    }
    return false;
  }

  async disconnect(): Promise<void> {
    if (this.serialConnection) {
      await this.serialConnection.disconnect();
      this.serialConnection = null;
    }
    if (this.usbConnection) {
      await this.usbConnection.disconnect();
      this.usbConnection = null;
    }
  }

  private async write(data: Uint8Array): Promise<void> {
    if (this.config.connectionType === 'serial' && this.serialConnection) {
      await this.serialConnection.write(data);
    } else if (this.usbConnection) {
      await this.usbConnection.write(data);
    } else {
      throw new Error('No printer connection available');
    }
  }

  async printReceipt(receiptData: Omit<ReceiptData, 'shopName' | 'shopAddress' | 'shopPhone' | 'shopTaxId' | 'footerText'>): Promise<void> {
    const fullData: ReceiptData = {
      ...receiptData,
      shopName: this.config.shopName || 'ร้านอาหาร',
      shopAddress: this.config.shopAddress,
      shopPhone: this.config.shopPhone,
      shopTaxId: this.config.shopTaxId,
      footerText: this.config.footerText,
    };

    const data = formatReceipt(fullData, this.config.paperWidth);
    await this.write(data);
  }

  async printTaxInvoice(
    receiptData: Omit<ReceiptData, 'shopName' | 'shopAddress' | 'shopPhone' | 'shopTaxId' | 'footerText'> & {
      buyerName: string;
      buyerTaxId: string;
      buyerAddress: string;
      buyerBranch?: string;
      invoiceNumber: string;
    },
  ): Promise<void> {
    const fullData = {
      ...receiptData,
      shopName: this.config.shopName || 'ร้านอาหาร',
      shopAddress: this.config.shopAddress,
      shopPhone: this.config.shopPhone,
      shopTaxId: this.config.shopTaxId,
      footerText: this.config.footerText,
    };

    const data = formatTaxInvoiceReceipt(fullData, this.config.paperWidth);
    await this.write(data);
  }

  async openCashDrawer(pin: 'pin2' | 'pin5' = 'pin2'): Promise<void> {
    const builder = new ESCPOSBuilder();
    const data = builder.init().openDrawer(pin).build();
    await this.write(data);
  }

  async testPrint(): Promise<void> {
    const builder = new ESCPOSBuilder(this.config.paperWidth);
    const data = builder
      .init()
      .alignCenter()
      .textDouble()
      .bold()
      .line('*** TEST PRINT ***')
      .textNormal()
      .bold(false)
      .feed()
      .line(this.config.shopName || 'ร้านอาหาร')
      .line(`Connection: ${this.config.connectionType}`)
      .line(`Paper Width: ${this.config.paperWidth} chars`)
      .line(`Date: ${new Date().toLocaleString('th-TH')}`)
      .feed()
      .line('ทดสอบภาษาไทย')
      .line('กขคงจฉชซฌญฎฏฐฑ')
      .feed()
      .separator()
      .columns('Item A', '100.00')
      .columns('Item B', '250.50')
      .separator()
      .bold()
      .columns('Total', '350.50')
      .bold(false)
      .feed()
      .alignCenter()
      .line('Test Complete!')
      .feed()
      .cut()
      .build();

    await this.write(data);
  }
}

// Singleton instance
let printerServiceInstance: PrinterService | null = null;

export function getPrinterService(config?: Partial<PrinterServiceConfig>): PrinterService {
  if (!printerServiceInstance) {
    printerServiceInstance = new PrinterService(config);
  } else if (config) {
    printerServiceInstance.updateConfig(config);
  }
  return printerServiceInstance;
}
