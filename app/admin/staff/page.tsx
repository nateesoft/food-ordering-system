'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Shield,
  ChefHat,
  UserCheck,
  X,
  Save,
  Eye,
  EyeOff,
  Key,
  ArrowLeft,
  Search,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface StaffUser {
  id: number;
  username: string;
  name: string;
  role: string;
  pin: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const roleConfig: Record<string, { label: string; color: string; icon: any }> = {
  ADMIN: { label: 'Admin', color: 'bg-red-100 text-red-700', icon: Shield },
  CHEF: { label: 'Chef', color: 'bg-orange-100 text-orange-700', icon: ChefHat },
  STAFF: { label: 'Staff', color: 'bg-blue-100 text-blue-700', icon: UserCheck },
};

export default function StaffManagementPage() {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<StaffUser | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'STAFF',
    pin: '',
    isActive: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Load users
  const loadUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !filterRole || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  // Open create modal
  const openCreateModal = () => {
    setEditUser(null);
    setFormData({
      username: '',
      password: '',
      name: '',
      role: 'STAFF',
      pin: '',
      isActive: true,
    });
    setFormError('');
    setShowPassword(false);
    setShowModal(true);
  };

  // Open edit modal
  const openEditModal = (user: StaffUser) => {
    setEditUser(user);
    setFormData({
      username: user.username,
      password: '',
      name: user.name,
      role: user.role,
      pin: user.pin || '',
      isActive: user.isActive,
    });
    setFormError('');
    setShowPassword(false);
    setShowModal(true);
  };

  // Save user
  const handleSave = async () => {
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('กรุณาระบุชื่อ');
      return;
    }

    if (!editUser && !formData.username.trim()) {
      setFormError('กรุณาระบุ Username');
      return;
    }

    if (!editUser && !formData.password) {
      setFormError('กรุณาระบุรหัสผ่าน');
      return;
    }

    if (formData.pin && (formData.pin.length < 4 || formData.pin.length > 6)) {
      setFormError('PIN ต้องมี 4-6 หลัก');
      return;
    }

    setSaving(true);
    try {
      if (editUser) {
        // Update
        const updateData: any = {
          name: formData.name,
          role: formData.role,
          pin: formData.pin || undefined,
          isActive: formData.isActive,
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        await api.updateUser(editUser.id, updateData);
      } else {
        // Create
        await api.createUser({
          username: formData.username,
          password: formData.password,
          name: formData.name,
          role: formData.role,
        });
      }

      setShowModal(false);
      loadUsers();
    } catch (err: any) {
      setFormError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  };

  // Toggle active status
  const toggleActive = async (user: StaffUser) => {
    try {
      await api.updateUser(user.id, { isActive: !user.isActive });
      loadUsers();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  // Delete user
  const handleDelete = async (id: number) => {
    try {
      await api.deleteUser(id);
      setDeleteId(null);
      loadUsers();
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  // Stats
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.isActive).length;
  const adminCount = users.filter((u) => u.role === 'ADMIN').length;
  const chefCount = users.filter((u) => u.role === 'CHEF').length;
  const staffCount = users.filter((u) => u.role === 'STAFF').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 shadow-xl">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-2">
            <Link
              href="/admin"
              className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Users className="w-8 h-8" />
                จัดการพนักงาน
              </h1>
              <p className="text-indigo-200 mt-1">
                Staff Management - เพิ่ม/แก้ไข/ลบ พนักงาน
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500">ทั้งหมด</p>
            <p className="text-2xl font-bold text-gray-800">{totalUsers}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-green-600">ใช้งานอยู่</p>
            <p className="text-2xl font-bold text-green-700">{activeUsers}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-red-600">Admin</p>
            <p className="text-2xl font-bold text-red-700">{adminCount}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-orange-600">Chef</p>
            <p className="text-2xl font-bold text-orange-700">{chefCount}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-blue-600">Staff</p>
            <p className="text-2xl font-bold text-blue-700">{staffCount}</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1 relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาชื่อหรือ username..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex gap-2">
            {['', 'ADMIN', 'CHEF', 'STAFF'].map((role) => (
              <button
                key={role || 'all'}
                onClick={() => setFilterRole(role)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterRole === role
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {role || 'ทั้งหมด'}
              </button>
            ))}
          </div>

          <button
            onClick={openCreateModal}
            className="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm font-semibold whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            เพิ่มพนักงาน
          </button>
        </div>

        {/* User List */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">กำลังโหลด...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">ไม่พบข้อมูลพนักงาน</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">
                    พนักงาน
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">
                    Username
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">
                    ตำแหน่ง
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">
                    PIN
                  </th>
                  <th className="text-center px-6 py-3 text-sm font-semibold text-gray-600">
                    สถานะ
                  </th>
                  <th className="text-center px-6 py-3 text-sm font-semibold text-gray-600">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredUsers.map((user) => {
                  const role = roleConfig[user.role] || roleConfig.STAFF;
                  const RoleIcon = role.icon;
                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-gray-50 ${
                        !user.isActive ? 'opacity-50' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${role.color}`}
                          >
                            <RoleIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">
                              {user.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              สร้างเมื่อ{' '}
                              {new Date(user.createdAt).toLocaleDateString(
                                'th-TH'
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm text-gray-600">
                          {user.username}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${role.color}`}
                        >
                          {role.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {user.pin ? (
                          <span className="flex items-center gap-1 text-sm text-green-600">
                            <Key className="w-3 h-3" />
                            {user.pin}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => toggleActive(user)}
                          className="inline-flex items-center gap-1"
                        >
                          {user.isActive ? (
                            <ToggleRight className="w-8 h-8 text-green-500" />
                          ) : (
                            <ToggleLeft className="w-8 h-8 text-gray-300" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="แก้ไข"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteId(user.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="ลบ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {editUser ? 'แก้ไขพนักงาน' : 'เพิ่มพนักงานใหม่'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">
                  {formError}
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อ-นามสกุล *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="ชื่อพนักงาน"
                />
              </div>

              {/* Username (create only) */}
              {!editUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="username"
                  />
                </div>
              )}

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  รหัสผ่าน {editUser ? '(เว้นว่างถ้าไม่เปลี่ยน)' : '*'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full border rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="********"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ตำแหน่ง
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(roleConfig).map(([key, config]) => {
                    const Icon = config.icon;
                    return (
                      <button
                        key={key}
                        onClick={() =>
                          setFormData({ ...formData, role: key })
                        }
                        className={`p-3 rounded-lg border-2 text-center transition-all ${
                          formData.role === key
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon
                          className={`w-5 h-5 mx-auto mb-1 ${
                            formData.role === key
                              ? 'text-indigo-600'
                              : 'text-gray-400'
                          }`}
                        />
                        <span className="text-xs font-semibold">
                          {config.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* PIN */}
              {editUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PIN (4-6 หลัก)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.pin}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setFormData({ ...formData, pin: val });
                      }}
                      className="flex-1 border rounded-lg px-4 py-2 font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="เช่น 1234"
                      maxLength={6}
                    />
                    <button
                      onClick={() => setFormData({ ...formData, pin: '' })}
                      className="bg-gray-100 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-200 text-sm"
                    >
                      ล้าง
                    </button>
                  </div>
                </div>
              )}

              {/* Active Toggle (edit only) */}
              {editUser && (
                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                  <span className="text-sm font-medium text-gray-700">
                    สถานะการใช้งาน
                  </span>
                  <button
                    onClick={() =>
                      setFormData({
                        ...formData,
                        isActive: !formData.isActive,
                      })
                    }
                    className="flex items-center gap-2"
                  >
                    {formData.isActive ? (
                      <>
                        <ToggleRight className="w-8 h-8 text-green-500" />
                        <span className="text-sm text-green-600 font-medium">
                          ใช้งาน
                        </span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-8 h-8 text-gray-300" />
                        <span className="text-sm text-gray-400 font-medium">
                          ปิดใช้งาน
                        </span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="p-6 border-t flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {saving
                  ? 'กำลังบันทึก...'
                  : editUser
                  ? 'บันทึกการแก้ไข'
                  : 'เพิ่มพนักงาน'}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-6 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center">
            <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">ยืนยันการลบ</h3>
            <p className="text-gray-600 mb-6">
              ต้องการลบพนักงาน{' '}
              <strong>
                {users.find((u) => u.id === deleteId)?.name}
              </strong>{' '}
              หรือไม่?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700"
              >
                ลบ
              </button>
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
