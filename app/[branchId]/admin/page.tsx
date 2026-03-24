'use client';

import React from 'react';
import Link from 'next/link';
import {
  QrCode,
  Menu,
  ClipboardList,
  Monitor,
  LayoutGrid,
  ArrowRight,
  Settings,
  BarChart3,
  Users,
  Package,
  DollarSign,
  Building2,
  Clock,
  Tag,
  Webhook,
  Armchair,
  FileText,
} from 'lucide-react';
import BranchSelector from '@/components/BranchSelector';

export default function AdminDashboard({ params }: { params: { branchId: string } }) {
  const adminSections = [
    {
      title: 'QR Code Management',
      description: 'จัดการ QR Code สำหรับโต๊ะต่างๆ',
      icon: QrCode,
      href: '/admin/qr-codes',
      color: 'from-blue-500 to-cyan-500',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Menu Management',
      description: 'จัดการเมนูอาหารและราคา',
      icon: Menu,
      href: '/admin/menu-management',
      color: 'from-orange-500 to-red-500',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600'
    },
    {
      title: 'Kiosk System',
      description: 'ระบบสั่งอาหารแบบ Self-Service',
      icon: LayoutGrid,
      href: '/kiosk',
      color: 'from-purple-500 to-pink-500',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600'
    },
    {
      title: 'Kitchen Dashboard',
      description: 'Dashboard แสดงคิวแบบ Kanban Board',
      icon: BarChart3,
      href: '/kiosk/dashboard',
      color: 'from-slate-600 to-slate-800',
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-600'
    },
    {
      title: 'Queue Management',
      description: 'จัดการคิวและออเดอร์จาก Kiosk',
      icon: ClipboardList,
      href: '/kiosk/queue-management',
      color: 'from-indigo-500 to-purple-500',
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-600'
    },
    {
      title: 'Display Board',
      description: 'หน้าจอแสดงผลคิวสำหรับลูกค้า',
      icon: Monitor,
      href: '/kiosk/display',
      color: 'from-green-500 to-emerald-500',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    {
      title: 'Kitchen Orders',
      description: 'จัดการออเดอร์ในครัว',
      icon: Settings,
      href: '/orders',
      color: 'from-yellow-500 to-orange-500',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600'
    },
    {
      title: 'Table Management',
      description: 'จัดการโต๊ะ แผนผังร้าน ลากวางตำแหน่ง',
      icon: Armchair,
      href: '/admin/tables',
      color: 'from-sky-500 to-blue-500',
      iconBg: 'bg-sky-100',
      iconColor: 'text-sky-600'
    },
    {
      title: 'POS System',
      description: 'ระบบรับชำระเงิน สำหรับแคชเชียร์',
      icon: DollarSign,
      href: '/pos',
      color: 'from-emerald-500 to-teal-500',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600'
    },
    {
      title: 'Staff Management',
      description: 'จัดการข้อมูลพนักงาน เพิ่ม/แก้ไข/ลบ',
      icon: Users,
      href: '/admin/staff',
      color: 'from-rose-500 to-pink-500',
      iconBg: 'bg-rose-100',
      iconColor: 'text-rose-600'
    },
    {
      title: 'Inventory Management',
      description: 'จัดการวัตถุดิบและสต็อกสินค้า',
      icon: Package,
      href: '/admin/inventory',
      color: 'from-amber-500 to-yellow-500',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600'
    },
    {
      title: 'Reports & Analytics',
      description: 'รายงานและวิเคราะห์ข้อมูลร้านอาหาร',
      icon: BarChart3,
      href: '/admin/reports',
      color: 'from-cyan-500 to-blue-500',
      iconBg: 'bg-cyan-100',
      iconColor: 'text-cyan-600'
    },
    {
      title: 'Shift Management',
      description: 'จัดการกะ เปิด/ปิดกะ นับเงินลิ้นชัก สรุปยอด',
      icon: Clock,
      href: '/admin/shifts',
      color: 'from-violet-500 to-purple-500',
      iconBg: 'bg-violet-100',
      iconColor: 'text-violet-600'
    },
    {
      title: 'Branch Management',
      description: 'จัดการสาขา เพิ่ม/แก้ไข/ลบสาขา',
      icon: Building2,
      href: '/admin/branches',
      color: 'from-teal-500 to-cyan-500',
      iconBg: 'bg-teal-100',
      iconColor: 'text-teal-600'
    },
    {
      title: 'Promotion Management',
      description: 'จัดการโปรโมชัน คูปอง ส่วนลด Happy Hour',
      icon: Tag,
      href: '/admin/promotions',
      color: 'from-orange-500 to-amber-500',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600'
    },
    {
      title: 'Webhooks',
      description: 'จัดการ Webhook เชื่อมต่อกับระบบภายนอก',
      icon: Webhook,
      href: '/admin/webhooks',
      color: 'from-indigo-500 to-blue-500',
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-600'
    },
    {
      title: 'Audit Logs',
      description: 'ติดตามประวัติการดำเนินการ ออเดอร์ และการชำระเงิน',
      icon: FileText,
      href: '/admin/audit-logs',
      color: 'from-gray-500 to-slate-600',
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8 shadow-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-bold mb-3">🎛️ Admin Dashboard</h1>
            <p className="text-2xl text-indigo-100">ระบบจัดการร้านอาหาร</p>
          </div>
          <BranchSelector />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">เลือกระบบที่ต้องการจัดการ</h2>
          <p className="text-xl text-gray-600">กรุณาเลือกหน้าจัดการที่ต้องการใช้งาน</p>
        </div>

        {/* Grid of Admin Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminSections.map((section) => {
            const Icon = section.icon;
            return (
              <Link
                key={section.href}
                href={section.href}
                className="group"
              >
                <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden hover:scale-105">
                  {/* Gradient Header */}
                  <div className={`h-2 bg-gradient-to-r ${section.color}`}></div>

                  <div className="p-8">
                    {/* Icon */}
                    <div className={`${section.iconBg} w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`w-8 h-8 ${section.iconColor}`} />
                    </div>

                    {/* Title */}
                    <h3 className="text-2xl font-bold text-gray-800 mb-3 group-hover:text-indigo-600 transition-colors">
                      {section.title}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-600 text-lg mb-6">
                      {section.description}
                    </p>

                    {/* Arrow */}
                    <div className="flex items-center gap-2 text-indigo-600 font-bold text-lg group-hover:gap-4 transition-all">
                      <span>เข้าสู่ระบบ</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Quick Info Section */}
        <div className="mt-12 bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">📚 คู่มือการใช้งาน</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border-l-4 border-blue-500 pl-6">
              <h4 className="text-xl font-bold text-gray-800 mb-2">QR Code & Menu</h4>
              <p className="text-gray-600">
                สำหรับลูกค้าสั่งอาหารผ่าน QR Code ที่โต๊ะ เหมาะสำหรับระบบ Dine-In แบบดั้งเดิม
              </p>
            </div>
            <div className="border-l-4 border-purple-500 pl-6">
              <h4 className="text-xl font-bold text-gray-800 mb-2">Kiosk System</h4>
              <p className="text-gray-600">
                ระบบสั่งอาหารแบบเซลฟ์เซอร์วิส พร้อมระบบคิวอัตโนมัติ เหมาะสำหรับร้านฟาสต์ฟู้ด
              </p>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="bg-green-500 w-4 h-4 rounded-full animate-pulse"></div>
            <div>
              <h4 className="text-xl font-bold text-gray-800">System Status</h4>
              <p className="text-gray-600">ระบบทำงานปกติ • All systems operational</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
