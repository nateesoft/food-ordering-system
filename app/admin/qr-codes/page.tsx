'use client';

import React, { useState, useEffect, useRef } from 'react';
import { QrCode, Download, Printer, Home, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import QRCodeLib from 'qrcode';

interface Table {
  id: number;
  number: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved';
}

export default function QRCodesAdminPage() {
  const router = useRouter();
  const [tables] = useState<Table[]>([
    { id: 1, number: 'A1', capacity: 2, status: 'available' },
    { id: 2, number: 'A2', capacity: 2, status: 'available' },
    { id: 3, number: 'A3', capacity: 4, status: 'available' },
    { id: 4, number: 'A4', capacity: 4, status: 'available' },
    { id: 5, number: 'B1', capacity: 4, status: 'available' },
    { id: 6, number: 'B2', capacity: 4, status: 'available' },
    { id: 7, number: 'B3', capacity: 6, status: 'available' },
    { id: 8, number: 'C1', capacity: 2, status: 'available' },
    { id: 9, number: 'C2', capacity: 2, status: 'available' },
    { id: 10, number: 'C3', capacity: 4, status: 'available' },
    { id: 11, number: 'C4', capacity: 8, status: 'available' },
  ]);

  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [baseUrl, setBaseUrl] = useState<string>('');
  const [generatingTables, setGeneratingTables] = useState<Set<string>>(new Set());
  const canvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({});

  useEffect(() => {
    // Set base URL only on client side
    setBaseUrl(window.location.origin);
  }, []);

  // สร้าง QR Code สำหรับโต๊ะเดียว
  const generateSingleQRCode = async (tableNumber: string) => {
    setGeneratingTables(prev => new Set(prev).add(tableNumber));

    try {
      const url = `${baseUrl}/table/${tableNumber}`;
      const qrDataUrl = await QRCodeLib.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      setQrCodes(prev => ({
        ...prev,
        [tableNumber]: qrDataUrl
      }));
    } catch (error) {
      console.error(`Error generating QR for table ${tableNumber}:`, error);
      alert(`เกิดข้อผิดพลาดในการสร้าง QR Code สำหรับโต๊ะ ${tableNumber}`);
    } finally {
      setGeneratingTables(prev => {
        const newSet = new Set(prev);
        newSet.delete(tableNumber);
        return newSet;
      });
    }
  };

  // สร้าง QR Code ทั้งหมด
  const generateAllQRCodes = async () => {
    for (const table of tables) {
      await generateSingleQRCode(table.number);
    }
  };

  const downloadQRCode = async (tableNumber: string) => {
    const url = `${baseUrl}/table/${tableNumber}`;

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = 600;
      canvas.height = 750;

      if (ctx) {
        // สีพื้นหลัง
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // สร้าง QR Code ขนาดใหญ่
        const qrDataUrl = await QRCodeLib.toDataURL(url, {
          width: 500,
          margin: 2,
        });

        const qrImage = new Image();
        qrImage.src = qrDataUrl;

        await new Promise((resolve) => {
          qrImage.onload = resolve;
        });

        // วาด QR Code
        ctx.drawImage(qrImage, 50, 100, 500, 500);

        // ข้อความด้านบน
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`โต๊ะ ${tableNumber}`, 300, 60);

        // ข้อความด้านล่าง
        ctx.font = '24px Arial';
        ctx.fillText('สแกน QR Code เพื่อสั่งอาหาร', 300, 670);
        ctx.font = '18px Arial';
        ctx.fillStyle = '#666666';
        ctx.fillText('Scan to Order', 300, 700);
      }

      // Download
      const link = document.createElement('a');
      link.download = `table-${tableNumber}-qr.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error downloading QR code:', error);
    }
  };

  const printQRCode = async (tableNumber: string) => {
    const url = `${baseUrl}/table/${tableNumber}`;

    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      const qrDataUrl = await QRCodeLib.toDataURL(url, {
        width: 500,
        margin: 2,
      });

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>QR Code - โต๊ะ ${tableNumber}</title>
            <style>
              body {
                margin: 0;
                padding: 40px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                font-family: Arial, sans-serif;
              }
              .container {
                text-align: center;
                border: 3px solid #000;
                padding: 30px;
                border-radius: 15px;
              }
              h1 {
                font-size: 48px;
                margin: 0 0 20px 0;
                color: #000;
              }
              img {
                width: 400px;
                height: 400px;
                margin: 20px 0;
              }
              .instruction {
                font-size: 24px;
                margin: 20px 0 5px 0;
                color: #333;
              }
              .sub-instruction {
                font-size: 18px;
                color: #666;
              }
              @media print {
                body {
                  padding: 20px;
                }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>โต๊ะ ${tableNumber}</h1>
              <img src="${qrDataUrl}" alt="QR Code">
              <p class="instruction">สแกน QR Code เพื่อสั่งอาหาร</p>
              <p class="sub-instruction">Scan to Order</p>
            </div>
          </body>
        </html>
      `);

      printWindow.document.close();

      setTimeout(() => {
        printWindow.print();
      }, 250);
    } catch (error) {
      console.error('Error printing QR code:', error);
    }
  };

  const downloadAllQRCodes = async () => {
    for (const table of tables) {
      await downloadQRCode(table.number);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Header - Sticky */}
      <div className="sticky top-0 z-50 bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Mobile: Stack vertically */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500 rounded-lg">
                <QrCode className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">จัดการ QR Code โต๊ะ</h1>
                <p className="text-xs sm:text-sm text-gray-600">สร้างและจัดการ QR Code</p>
              </div>
            </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={generateAllQRCodes}
              disabled={!baseUrl || generatingTables.size > 0}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <QrCode className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>{generatingTables.size > 0 ? 'กำลังสร้าง...' : 'สร้างทั้งหมด'}</span>
            </button>

            <button
              onClick={downloadAllQRCodes}
              disabled={!baseUrl || Object.keys(qrCodes).length === 0}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>ดาวน์โหลดทั้งหมด</span>
            </button>

            <button
              onClick={() => router.push('/orders')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all"
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">ออเดอร์</span>
              <span className="sm:hidden">ออเดอร์</span>
            </button>

            <button
              onClick={() => router.push('/')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all"
            >
              <Home className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">หน้าหลัก</span>
              <span className="sm:hidden">หลัก</span>
            </button>
          </div>
          </div>
        </div>
      </div>

      {/* QR Codes Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            QR Code ทั้งหมด ({Object.keys(qrCodes).length}/{tables.length} โต๊ะ)
          </h2>
          <p className="text-gray-600">คลิก "สร้าง QR Code" ในโต๊ะที่ต้องการ หรือสร้างทั้งหมดพร้อมกัน</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {tables.map((table) => (
            <div
              key={table.id}
              className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all"
            >
              <div className="p-4 sm:p-6">
                {/* Table Info */}
                <div className="text-center mb-3 sm:mb-4">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">โต๊ะ {table.number}</h3>
                  <p className="text-xs sm:text-sm text-gray-600">ความจุ {table.capacity} ที่นั่ง</p>
                </div>

                {/* QR Code หรือปุ่มสร้าง */}
                {qrCodes[table.number] ? (
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg sm:rounded-xl mb-3 sm:mb-4">
                    <img
                      src={qrCodes[table.number]}
                      alt={`QR Code for table ${table.number}`}
                      className="w-full h-auto"
                    />
                  </div>
                ) : (
                  <div className="bg-gray-100 p-8 sm:p-12 rounded-lg sm:rounded-xl mb-3 sm:mb-4 flex items-center justify-center">
                    <div className="text-center">
                      <QrCode className="w-16 h-16 mx-auto text-gray-300 mb-3" />
                      <p className="text-sm text-gray-500">ยังไม่ได้สร้าง QR Code</p>
                    </div>
                  </div>
                )}

                {/* URL Display */}
                <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-gray-100 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">URL:</p>
                  <p className="text-xs font-mono text-gray-800 break-all leading-relaxed">
                    {baseUrl ? `${baseUrl}/table/${table.number}` : 'Loading...'}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  {!qrCodes[table.number] ? (
                    <button
                      onClick={() => generateSingleQRCode(table.number)}
                      disabled={!baseUrl || generatingTables.has(table.number)}
                      className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {generatingTables.has(table.number) ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>กำลังสร้าง...</span>
                        </>
                      ) : (
                        <>
                          <QrCode className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span>สร้าง QR Code</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => downloadQRCode(table.number)}
                        disabled={!baseUrl}
                        className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>ดาวน์โหลด</span>
                      </button>

                      <button
                        onClick={() => printQRCode(table.number)}
                        disabled={!baseUrl}
                        className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Printer className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>พิมพ์</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
            <span className="text-orange-500">ℹ️</span>
            วิธีใช้งาน
          </h3>
          <ol className="list-decimal list-inside space-y-2 sm:space-y-2 text-xs sm:text-sm text-gray-700">
            <li className="leading-relaxed">คลิก "สร้าง QR Code" ในโต๊ะที่ต้องการสร้าง หรือคลิก "สร้างทั้งหมด" เพื่อสร้างทุกโต๊ะพร้อมกัน</li>
            <li className="leading-relaxed">เมื่อสร้างเสร็จ คลิก "ดาวน์โหลด" เพื่อบันทึก QR Code เป็นไฟล์ภาพ</li>
            <li className="leading-relaxed">คลิก "พิมพ์" เพื่อพิมพ์ QR Code โดยตรง</li>
            <li className="leading-relaxed">นำ QR Code ไปติดที่โต๊ะที่ตรงกับหมายเลข</li>
            <li className="leading-relaxed">ลูกค้าสแกน QR Code เพื่อเข้าสู่หน้าสั่งอาหารของโต๊ะนั้นๆ</li>
            <li className="leading-relaxed">ระบบจะทราบหมายเลขโต๊ะอัตโนมัติเมื่อลูกค้าสั่งอาหาร</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
