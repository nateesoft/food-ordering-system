'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Link from 'next/link';

export default function TaxSettingsPage() {
  const [companyName, setCompanyName] = useState('');
  const [companyNameEn, setCompanyNameEn] = useState('');
  const [taxId, setTaxId] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [branchNumber, setBranchNumber] = useState('00000');
  const [branchName, setBranchName] = useState('');
  const [isHeadOffice, setIsHeadOffice] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // Tax invoices list
  const [invoices, setInvoices] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'settings' | 'invoices'>('settings');

  useEffect(() => {
    loadCompanyInfo();
    loadInvoices();
  }, []);

  const loadCompanyInfo = async () => {
    try {
      const info = await api.getCompanyTaxInfo();
      if (info) {
        setCompanyName(info.companyName || '');
        setCompanyNameEn(info.companyNameEn || '');
        setTaxId(info.taxId || '');
        setAddress(info.address || '');
        setPhone(info.phone || '');
        setBranchNumber(info.branchNumber || '00000');
        setBranchName(info.branchName || '');
        setIsHeadOffice(info.isHeadOffice ?? true);
      }
    } catch { /* first time */ }
  };

  const loadInvoices = async () => {
    try {
      const data = await api.getTaxInvoices();
      setInvoices(data || []);
    } catch { /* ignore */ }
  };

  const handleSave = async () => {
    setLoading(true);
    setSaveMsg('');
    try {
      await api.updateCompanyTaxInfo({
        companyName,
        companyNameEn,
        taxId: taxId.replace(/\D/g, ''),
        address,
        phone,
        branchNumber: isHeadOffice ? '00000' : branchNumber,
        branchName,
        isHeadOffice,
      });
      setSaveMsg('บันทึกสำเร็จ!');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err: any) {
      setSaveMsg('เกิดข้อผิดพลาด: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleVoid = async (id: number) => {
    const reason = prompt('กรุณาระบุเหตุผลในการยกเลิก:');
    if (!reason) return;
    try {
      await api.voidTaxInvoice(id, reason);
      loadInvoices();
    } catch (err: any) {
      alert('ไม่สามารถยกเลิกได้: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin" className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">ตั้งค่าใบกำกับภาษี</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-200 rounded-lg p-1 w-fit">
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'settings' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            ข้อมูลบริษัท
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'invoices' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            รายการใบกำกับภาษี ({invoices.length})
          </button>
        </div>

        {activeTab === 'settings' ? (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">ข้อมูลผู้ออกใบกำกับภาษี</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อบริษัท (ภาษาไทย) *</label>
                  <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อบริษัท (ภาษาอังกฤษ)</label>
                  <input type="text" value={companyNameEn} onChange={(e) => setCompanyNameEn(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">เลขประจำตัวผู้เสียภาษี (13 หลัก) *</label>
                  <input type="text" value={taxId} onChange={(e) => setTaxId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono" maxLength={17} placeholder="0-0000-00000-00-0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทร</label>
                  <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ที่อยู่ *</label>
                <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">สาขา</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={isHeadOffice} onChange={() => setIsHeadOffice(true)} className="text-blue-600" />
                    <span className="text-sm">สำนักงานใหญ่</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={!isHeadOffice} onChange={() => setIsHeadOffice(false)} className="text-blue-600" />
                    <span className="text-sm">สาขา</span>
                  </label>
                  {!isHeadOffice && (
                    <input type="text" value={branchNumber} onChange={(e) => setBranchNumber(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-24" maxLength={5} />
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 pt-2">
                <button onClick={handleSave} disabled={loading} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
                  {loading ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
                {saveMsg && <span className={`text-sm font-medium ${saveMsg.includes('สำเร็จ') ? 'text-green-600' : 'text-red-600'}`}>{saveMsg}</span>}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">เลขที่</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">ใบเสร็จ</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">ผู้ซื้อ</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">ยอดเงิน</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">วันที่</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">สถานะ</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoices.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">ยังไม่มีใบกำกับภาษี</td></tr>
                ) : invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3 text-xs">{inv.receiptNumber || '-'}</td>
                    <td className="px-4 py-3">{inv.buyerName}</td>
                    <td className="px-4 py-3 text-right font-mono">฿{inv.totalAmount?.toFixed(2)}</td>
                    <td className="px-4 py-3 text-xs">{new Date(inv.issuedAt).toLocaleDateString('th-TH')}</td>
                    <td className="px-4 py-3 text-center">
                      {inv.voidedAt ? (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">ยกเลิก</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">ปกติ</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {!inv.voidedAt && (
                        <button onClick={() => handleVoid(inv.id)} className="text-red-500 hover:text-red-700 text-xs">
                          ยกเลิก
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
