'use client';

interface TaxInvoicePreviewProps {
  invoice: any;
  companyInfo?: any;
  onClose: () => void;
  onPrint: () => void;
}

export default function TaxInvoicePreview({ invoice, companyInfo, onClose, onPrint }: TaxInvoicePreviewProps) {
  const items = invoice.items || [];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-800">ใบกำกับภาษี / Tax Invoice</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Invoice Content (Print-friendly) */}
        <div className="p-6 text-sm print:p-4" id="tax-invoice-print">
          {/* Title */}
          <div className="text-center mb-4">
            <h3 className="text-xl font-bold">ใบกำกับภาษี</h3>
            <p className="text-gray-500">TAX INVOICE</p>
          </div>

          {/* Seller Info */}
          {companyInfo && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="font-bold">{companyInfo.companyName}</p>
              {companyInfo.companyNameEn && <p className="text-gray-500">{companyInfo.companyNameEn}</p>}
              <p>{companyInfo.address}</p>
              <p>เลขประจำตัวผู้เสียภาษี: {companyInfo.taxId}</p>
              {companyInfo.phone && <p>โทร: {companyInfo.phone}</p>}
              <p>สาขา: {companyInfo.isHeadOffice ? 'สำนักงานใหญ่' : companyInfo.branchName || companyInfo.branchNumber}</p>
            </div>
          )}

          {/* Buyer Info */}
          <div className="mb-4 p-3 border rounded-lg">
            <p className="font-bold text-gray-600 mb-1">ข้อมูลผู้ซื้อ</p>
            <p className="font-bold">{invoice.buyerName}</p>
            <p>{invoice.buyerAddress}</p>
            <p>เลขประจำตัวผู้เสียภาษี: {invoice.buyerTaxId}</p>
            <p>สาขา: {invoice.buyerBranch === '00000' ? 'สำนักงานใหญ่' : invoice.buyerBranch}</p>
          </div>

          {/* Invoice Details */}
          <div className="flex justify-between mb-4 text-xs text-gray-500">
            <div>
              <p>เลขที่: <span className="font-bold text-gray-800">{invoice.invoiceNumber}</span></p>
              <p>ใบเสร็จ: {invoice.receiptNumber || '-'}</p>
            </div>
            <div className="text-right">
              <p>วันที่: {new Date(invoice.issuedAt).toLocaleDateString('th-TH')}</p>
              <p>เวลา: {new Date(invoice.issuedAt).toLocaleTimeString('th-TH')}</p>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full mb-4 text-xs">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="py-1 text-left">#</th>
                <th className="py-1 text-left">รายการ</th>
                <th className="py-1 text-right">จำนวน</th>
                <th className="py-1 text-right">ราคา/หน่วย</th>
                <th className="py-1 text-right">จำนวนเงิน</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any, i: number) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-1">{i + 1}</td>
                  <td className="py-1">{item.name}</td>
                  <td className="py-1 text-right">{item.quantity}</td>
                  <td className="py-1 text-right">{item.unitPrice?.toFixed(2)}</td>
                  <td className="py-1 text-right">{item.amount?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="border-t-2 border-gray-300 pt-2 space-y-1">
            <div className="flex justify-between">
              <span>ราคาสินค้า/บริการ (ก่อน VAT)</span>
              <span>฿{invoice.subtotal?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>ภาษีมูลค่าเพิ่ม 7%</span>
              <span>฿{invoice.vatAmount?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-base border-t pt-1">
              <span>จำนวนเงินรวมทั้งสิ้น</span>
              <span>฿{invoice.totalAmount?.toFixed(2)}</span>
            </div>
          </div>

          {/* Void indicator */}
          {invoice.voidedAt && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
              <p className="font-bold">ยกเลิก / VOIDED</p>
              <p className="text-xs">{invoice.voidReason}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t flex gap-2">
          <button
            onClick={onPrint}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            พิมพ์ใบกำกับภาษี
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
