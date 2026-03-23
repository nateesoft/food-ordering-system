import { ESCPOSBuilder } from './escpos-builder';

export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  specialInstructions?: string;
  addOns?: { name: string; price: number }[];
}

export interface ReceiptData {
  // Header
  shopName: string;
  shopAddress?: string;
  shopPhone?: string;
  shopTaxId?: string;

  // Receipt info
  receiptNumber: string;
  date: string;
  cashierName: string;
  tableNumber?: string;
  orderType?: string;

  // Items
  items: ReceiptItem[];

  // Totals
  subtotal: number;
  serviceCharge?: number;
  serviceChargePercent?: number;
  vat?: number;
  vatPercent?: number;
  discount?: number;
  promotionName?: string;
  memberDiscount?: number;
  totalAmount: number;

  // Payment
  paymentMethod: string;
  paidAmount?: number;
  changeAmount?: number;
  splitPayments?: { method: string; amount: number }[];

  // Member
  memberName?: string;
  memberPoints?: number;
  pointsEarned?: number;

  // Footer
  footerText?: string;
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function translatePaymentMethod(method: string): string {
  const map: Record<string, string> = {
    CASH: 'เงินสด',
    TRANSFER: 'โอนเงิน',
    CREDIT_CARD: 'บัตรเครดิต',
    PROMPTPAY: 'พร้อมเพย์',
  };
  return map[method] || method;
}

export function formatReceipt(data: ReceiptData, paperWidth = 48): Uint8Array {
  const b = new ESCPOSBuilder(paperWidth);

  b.init();

  // === Header ===
  b.alignCenter()
    .textDouble()
    .bold()
    .line(data.shopName)
    .textNormal()
    .bold(false);

  if (data.shopAddress) b.line(data.shopAddress);
  if (data.shopPhone) b.line(`โทร: ${data.shopPhone}`);
  if (data.shopTaxId) b.line(`เลขประจำตัวผู้เสียภาษี: ${data.shopTaxId}`);

  b.separator();

  // === Receipt info ===
  b.alignLeft()
    .columns('ใบเสร็จ:', data.receiptNumber)
    .columns('วันที่:', data.date)
    .columns('พนักงาน:', data.cashierName);

  if (data.tableNumber) b.columns('โต๊ะ:', data.tableNumber);
  if (data.orderType) b.columns('ประเภท:', data.orderType === 'DINE_IN' ? 'ทานที่ร้าน' : 'สั่งกลับบ้าน');

  b.separator();

  // === Items ===
  b.bold()
    .threeColumns('รายการ', 'จำนวน', 'ราคา')
    .bold(false)
    .dashedSeparator();

  for (const item of data.items) {
    b.columns(
      item.name,
      `${item.quantity} x ${formatCurrency(item.price)}`
    );
    b.alignRight()
      .line(formatCurrency(item.quantity * item.price))
      .alignLeft();

    if (item.addOns) {
      for (const addon of item.addOns) {
        b.columns(`  + ${addon.name}`, formatCurrency(addon.price));
      }
    }

    if (item.specialInstructions) {
      b.line(`  * ${item.specialInstructions}`);
    }
  }

  b.separator();

  // === Totals ===
  b.columns('ราคารวม', formatCurrency(data.subtotal));

  if (data.serviceCharge && data.serviceCharge > 0) {
    const scLabel = data.serviceChargePercent
      ? `ค่าบริการ (${data.serviceChargePercent}%)`
      : 'ค่าบริการ';
    b.columns(scLabel, formatCurrency(data.serviceCharge));
  }

  if (data.vat && data.vat > 0) {
    const vatLabel = data.vatPercent
      ? `ภาษีมูลค่าเพิ่ม (${data.vatPercent}%)`
      : 'ภาษีมูลค่าเพิ่ม';
    b.columns(vatLabel, formatCurrency(data.vat));
  }

  if (data.discount && data.discount > 0) {
    const discLabel = data.promotionName
      ? `ส่วนลด (${data.promotionName})`
      : 'ส่วนลด';
    b.columns(discLabel, `-${formatCurrency(data.discount)}`);
  }

  if (data.memberDiscount && data.memberDiscount > 0) {
    b.columns('ส่วนลดสมาชิก', `-${formatCurrency(data.memberDiscount)}`);
  }

  b.dashedSeparator()
    .bold()
    .textDoubleHeight()
    .columns('ยอดรวมสุทธิ', `${formatCurrency(data.totalAmount)} ฿`)
    .textNormal()
    .bold(false);

  b.separator();

  // === Payment ===
  if (data.splitPayments && data.splitPayments.length > 0) {
    b.line('การชำระเงิน:');
    for (const sp of data.splitPayments) {
      b.columns(`  ${translatePaymentMethod(sp.method)}`, formatCurrency(sp.amount));
    }
  } else {
    b.columns('ชำระโดย:', translatePaymentMethod(data.paymentMethod));
  }

  if (data.paidAmount && data.paidAmount > 0) {
    b.columns('รับเงิน', formatCurrency(data.paidAmount));
  }
  if (data.changeAmount && data.changeAmount > 0) {
    b.columns('เงินทอน', formatCurrency(data.changeAmount));
  }

  // === Member info ===
  if (data.memberName) {
    b.dashedSeparator()
      .columns('สมาชิก:', data.memberName);
    if (data.pointsEarned) {
      b.columns('แต้มที่ได้รับ:', `+${data.pointsEarned}`);
    }
    if (data.memberPoints !== undefined) {
      b.columns('แต้มสะสม:', data.memberPoints.toString());
    }
  }

  // === Footer ===
  b.feed()
    .alignCenter();

  if (data.footerText) {
    b.line(data.footerText);
  } else {
    b.line('ขอบคุณที่ใช้บริการ')
      .line('Thank you!');
  }

  b.feed()
    .cut();

  return b.build();
}

export function formatTaxInvoiceReceipt(
  data: ReceiptData & {
    buyerName: string;
    buyerTaxId: string;
    buyerAddress: string;
    buyerBranch?: string;
    invoiceNumber: string;
  },
  paperWidth = 48,
): Uint8Array {
  const b = new ESCPOSBuilder(paperWidth);

  b.init()
    .alignCenter()
    .textDouble()
    .bold()
    .line('ใบกำกับภาษี / Tax Invoice')
    .textNormal()
    .bold(false)
    .feed();

  // Seller info
  b.alignCenter()
    .bold()
    .line(data.shopName)
    .bold(false);
  if (data.shopAddress) b.line(data.shopAddress);
  if (data.shopPhone) b.line(`โทร: ${data.shopPhone}`);
  if (data.shopTaxId) b.line(`เลขประจำตัวผู้เสียภาษี: ${data.shopTaxId}`);

  b.separator();

  // Buyer info
  b.alignLeft()
    .bold()
    .line('ข้อมูลผู้ซื้อ:')
    .bold(false)
    .columns('ชื่อ:', data.buyerName)
    .columns('เลขผู้เสียภาษี:', data.buyerTaxId)
    .line(`ที่อยู่: ${data.buyerAddress}`);
  if (data.buyerBranch) {
    b.columns('สาขา:', data.buyerBranch === '00000' ? 'สำนักงานใหญ่' : data.buyerBranch);
  }

  b.separator()
    .columns('เลขที่ใบกำกับภาษี:', data.invoiceNumber)
    .columns('เลขที่ใบเสร็จ:', data.receiptNumber)
    .columns('วันที่:', data.date)
    .separator();

  // Items
  b.bold()
    .threeColumns('รายการ', 'จำนวน', 'ราคา')
    .bold(false)
    .dashedSeparator();

  for (const item of data.items) {
    b.columns(item.name, `${item.quantity} x ${formatCurrency(item.price)}`);
    b.alignRight().line(formatCurrency(item.quantity * item.price)).alignLeft();
  }

  b.separator()
    .columns('ราคาก่อนภาษี', formatCurrency(data.subtotal))
    .columns('ภาษีมูลค่าเพิ่ม 7%', formatCurrency(data.vat || 0))
    .bold()
    .textDoubleHeight()
    .columns('ยอดรวม', `${formatCurrency(data.totalAmount)} ฿`)
    .textNormal()
    .bold(false);

  b.feed()
    .alignCenter()
    .line('ขอบคุณที่ใช้บริการ')
    .feed()
    .cut();

  return b.build();
}
