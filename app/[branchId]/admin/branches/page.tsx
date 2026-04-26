'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  ArrowLeft,
  Search,
  ToggleLeft,
  ToggleRight,
  MapPin,
  Phone,
  Hash,
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Branch {
  id: number;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function BranchManagementPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editBranch, setEditBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    phone: '',
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const loadBranches = async () => {
    try {
      const data = await api.getBranches();
      setBranches(data);
    } catch (err) {
      console.error('Failed to load branches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  const openCreateModal = () => {
    setEditBranch(null);
    setFormData({ name: '', code: '', address: '', phone: '', isActive: true });
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (branch: Branch) => {
    setEditBranch(branch);
    setFormData({
      name: branch.name,
      code: branch.code,
      address: branch.address || '',
      phone: branch.phone || '',
      isActive: branch.isActive,
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setFormError('กรุณากรอกชื่อสาขา');
      return;
    }
    if (!formData.code.trim()) {
      setFormError('กรุณากรอกรหัสสาขา');
      return;
    }

    setSaving(true);
    setFormError('');

    try {
      if (editBranch) {
        await api.updateBranch(editBranch.id, {
          name: formData.name,
          code: formData.code,
          address: formData.address || undefined,
          phone: formData.phone || undefined,
          isActive: formData.isActive,
        });
      } else {
        await api.createBranch({
          name: formData.name,
          code: formData.code,
          address: formData.address || undefined,
          phone: formData.phone || undefined,
        });
      }
      setShowModal(false);
      loadBranches();
    } catch (err: any) {
      setFormError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.deleteBranch(deleteId);
      setDeleteId(null);
      loadBranches();
    } catch (err) {
      console.error('Failed to delete branch:', err);
    }
  };

  const filteredBranches = branches.filter(
    (b) =>
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white p-6 shadow-xl">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/admin" className="hover:bg-white/20 p-2 rounded-lg transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-4xl font-bold">Branch Management</h1>
              <p className="text-xl text-teal-100 mt-1">จัดการสาขา เพิ่ม/แก้ไข/ลบ</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Toolbar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาสาขา..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-teal-400 focus:outline-none text-lg"
            />
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-xl font-bold text-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            เพิ่มสาขา
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-20 text-gray-500 text-xl">Loading...</div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left p-4 text-sm font-semibold text-gray-600">สาขา</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-600">รหัส</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-600">ที่อยู่</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-600">โทรศัพท์</th>
                  <th className="text-center p-4 text-sm font-semibold text-gray-600">สถานะ</th>
                  <th className="text-center p-4 text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBranches.map((branch) => (
                  <tr key={branch.id} className="border-b last:border-b-0 hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-teal-100 w-10 h-10 rounded-lg flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-teal-600" />
                        </div>
                        <span className="font-bold text-gray-800 text-lg">{branch.name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg font-mono text-sm">
                        {branch.code}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600">
                      {branch.address ? (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="truncate max-w-xs">{branch.address}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-4 text-gray-600">
                      {branch.phone ? (
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4 text-gray-400" />
                          {branch.phone}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {branch.isActive ? (
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                          Active
                        </span>
                      ) : (
                        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(branch)}
                          className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                          title="แก้ไข"
                        >
                          <Edit2 className="w-5 h-5 text-blue-600" />
                        </button>
                        <button
                          onClick={() => setDeleteId(branch.id)}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                          title="ลบ"
                        >
                          <Trash2 className="w-5 h-5 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredBranches.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400 text-lg">
                      ไม่พบข้อมูลสาขา
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800">
                {editBranch ? 'แก้ไขสาขา' : 'เพิ่มสาขาใหม่'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  <Building2 className="w-4 h-4 inline mr-1" />
                  ชื่อสาขา *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-teal-400 focus:outline-none text-lg"
                  placeholder="เช่น สาขาสยาม"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  <Hash className="w-4 h-4 inline mr-1" />
                  รหัสสาขา *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-teal-400 focus:outline-none text-lg font-mono"
                  placeholder="เช่น SIAM"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  ที่อยู่
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-teal-400 focus:outline-none"
                  rows={2}
                  placeholder="ที่อยู่สาขา"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  <Phone className="w-4 h-4 inline mr-1" />
                  โทรศัพท์
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-teal-400 focus:outline-none"
                  placeholder="02-XXX-XXXX"
                />
              </div>

              {editBranch && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-semibold text-gray-700">สถานะ</span>
                  <button
                    onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                    className="flex items-center gap-2"
                  >
                    {formData.isActive ? (
                      <>
                        <ToggleRight className="w-8 h-8 text-green-500" />
                        <span className="text-green-600 font-semibold">Active</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-8 h-8 text-gray-400" />
                        <span className="text-gray-500 font-semibold">Inactive</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-3 p-6 border-t">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-bold text-lg hover:bg-gray-50 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {saving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">ยืนยันการลบ</h3>
            <p className="text-gray-600 mb-6">คุณต้องการลบสาขานี้หรือไม่? การลบจะไม่สามารถย้อนกลับได้</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-bold text-lg hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-lg flex items-center justify-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                ลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
