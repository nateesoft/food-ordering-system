'use client';

import { useState, useEffect } from 'react';
import { usePrinter } from '@/lib/hooks/usePrinter';
import { PrinterService } from '@/lib/printer/printer-service';
import type { ConnectionType } from '@/lib/printer/printer-service';
import Link from 'next/link';

export default function PrinterSettingsPage() {
  const printer = usePrinter();
  const [connectionType, setConnectionType] = useState<ConnectionType>('serial');
  const [baudRate, setBaudRate] = useState(9600);
  const [paperWidth, setPaperWidth] = useState(48);
  const [shopName, setShopName] = useState('ร้านอาหาร');
  const [shopAddress, setShopAddress] = useState('');
  const [shopPhone, setShopPhone] = useState('');
  const [shopTaxId, setShopTaxId] = useState('');
  const [footerText, setFooterText] = useState('ขอบคุณที่ใช้บริการ');
  const [supportedConnections, setSupportedConnections] = useState<ConnectionType[]>([]);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    setSupportedConnections(PrinterService.getSupportedConnections());
    try {
      const saved = localStorage.getItem('printer_config');
      if (saved) {
        const config = JSON.parse(saved);
        if (config.connectionType) setConnectionType(config.connectionType);
        if (config.serialConfig?.baudRate) setBaudRate(config.serialConfig.baudRate);
        if (config.paperWidth) setPaperWidth(config.paperWidth);
        if (config.shopName) setShopName(config.shopName);
        if (config.shopAddress) setShopAddress(config.shopAddress);
        if (config.shopPhone) setShopPhone(config.shopPhone);
        if (config.shopTaxId) setShopTaxId(config.shopTaxId);
        if (config.footerText) setFooterText(config.footerText);
      }
    } catch { /* ignore */ }
  }, []);

  const handleSave = () => {
    const config = {
      connectionType,
      serialConfig: { baudRate },
      paperWidth,
      shopName,
      shopAddress,
      shopPhone,
      shopTaxId,
      footerText,
    };
    localStorage.setItem('printer_config', JSON.stringify(config));
    printer.updateConfig(config);
    setSaveMessage('บันทึกสำเร็จ!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin" className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">ตั้งค่าเครื่องพิมพ์ใบเสร็จ</h1>
        </div>

        {/* Connection Status */}
        <div className={`p-4 rounded-xl mb-6 flex items-center justify-between ${
          printer.isConnected ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${printer.isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            <span className="font-medium">
              {printer.isConnected ? 'เชื่อมต่อเครื่องพิมพ์แล้ว' : 'ยังไม่ได้เชื่อมต่อ'}
            </span>
          </div>
          <div className="flex gap-2">
            {printer.isConnected ? (
              <>
                <button
                  onClick={printer.testPrint}
                  disabled={printer.isPrinting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                >
                  {printer.isPrinting ? 'กำลังพิมพ์...' : 'ทดสอบพิมพ์'}
                </button>
                <button
                  onClick={printer.openCashDrawer}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm"
                >
                  เปิดลิ้นชัก
                </button>
                <button
                  onClick={printer.disconnect}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                >
                  ตัดการเชื่อมต่อ
                </button>
              </>
            ) : (
              <button
                onClick={printer.connect}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                เชื่อมต่อเครื่องพิมพ์
              </button>
            )}
          </div>
        </div>

        {printer.error && (
          <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {printer.error}
          </div>
        )}

        {supportedConnections.length === 0 && (
          <div className="p-4 mb-6 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 font-medium">Browser ไม่รองรับ Web Serial / USB API</p>
            <p className="text-yellow-600 text-sm mt-1">กรุณาใช้ Chrome, Edge หรือ Opera เวอร์ชันล่าสุด</p>
          </div>
        )}

        {/* Connection Settings */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">การเชื่อมต่อ</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ประเภทการเชื่อมต่อ</label>
              <select
                value={connectionType}
                onChange={(e) => setConnectionType(e.target.value as ConnectionType)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="serial" disabled={!supportedConnections.includes('serial')}>
                  Web Serial (USB/COM Port) {!supportedConnections.includes('serial') ? '- ไม่รองรับ' : ''}
                </option>
                <option value="usb" disabled={!supportedConnections.includes('usb')}>
                  Web USB {!supportedConnections.includes('usb') ? '- ไม่รองรับ' : ''}
                </option>
              </select>
            </div>

            {connectionType === 'serial' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Baud Rate</label>
                <select
                  value={baudRate}
                  onChange={(e) => setBaudRate(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value={9600}>9600</option>
                  <option value={19200}>19200</option>
                  <option value={38400}>38400</option>
                  <option value={57600}>57600</option>
                  <option value={115200}>115200</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ขนาดกระดาษ</label>
              <select
                value={paperWidth}
                onChange={(e) => setPaperWidth(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value={32}>58mm (32 chars)</option>
                <option value={48}>80mm (48 chars)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Shop Info */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">ข้อมูลร้านค้า (แสดงบนใบเสร็จ)</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อร้าน</label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ที่อยู่</label>
              <textarea
                value={shopAddress}
                onChange={(e) => setShopAddress(e.target.value)}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทร</label>
                <input
                  type="text"
                  value={shopPhone}
                  onChange={(e) => setShopPhone(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">เลขประจำตัวผู้เสียภาษี</label>
                <input
                  type="text"
                  value={shopTaxId}
                  onChange={(e) => setShopTaxId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  maxLength={13}
                  placeholder="0000000000000"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ข้อความท้ายใบเสร็จ</label>
              <input
                type="text"
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            บันทึกการตั้งค่า
          </button>
          {saveMessage && (
            <span className="text-green-600 font-medium">{saveMessage}</span>
          )}
        </div>
      </div>
    </div>
  );
}
