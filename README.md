# ระบบสั่งอาหารออนไลน์ (Food Ordering System)

ระบบสั่งอาหารออนไลน์แบบครบวงจร สร้างด้วย Next.js 14, TypeScript และ Tailwind CSS

## ✨ คุณสมบัติ

### สำหรับลูกค้า
- 🍽️ แสดงเมนูอาหารพร้อมรูปภาพและรายละเอียด
- 🗂️ กรองเมนูตามหมวดหมู่
- 🛒 ระบบตะกร้าสินค้าแบบเรียลไทม์
- ➕ เพิ่ม/ลด/ลบสินค้าในตะกร้า
- 💰 คำนวณยอดรวมอัตโนมัติ
- ✅ ยืนยันการสั่งซื้อ
- 📝 เพิ่มคำสั่งพิเศษ (Special Instructions)
- 🎛️ ตัวเลือกเมนูแบบซ้อน (Nested Options)

### สำหรับ Kiosk
- 🏪 ระบบสั่งอาหารแบบ Self-Service
- 🏠 เลือกทานที่ร้าน (Dine-in) หรือซื้อกลับบ้าน (Takeaway)
- 💳 เลือกวิธีชำระเงิน (เงินสด, บัตรเครดิต, QR Code, Mobile Banking)
- 🎫 ระบบบัตรคิวอัตโนมัติ
- 👤 รองรับรหัสสมาชิก

### สำหรับร้านค้า
- 📋 หน้าจัดการออเดอร์สำหรับพ่อครัว/บริกร
- 📺 หน้าจอแสดงคิว (Queue Display)
- 📊 แดชบอร์ดสถิติคิว
- 🔧 ระบบจัดการเมนู
- 📱 สร้าง QR Code สำหรับโต๊ะ

### ทั่วไป
- 📱 Responsive Design - ใช้งานได้ทั้งมือถือ, แท็บเล็ต และคอมพิวเตอร์
- 🎨 UI/UX สวยงามด้วย Tailwind CSS
- 🌐 รองรับหลายภาษา

## 🚀 วิธีติดตั้งและรันโปรเจค

### ติดตั้ง Dependencies

```bash
npm install
```

### รันโปรเจคในโหมด Development

```bash
npm run dev
```

เปิดเบราว์เซอร์และเข้า [http://localhost:3000](http://localhost:3000)

### Build สำหรับ Production

```bash
npm run build
npm start
```

## 📱 หน้าจอในระบบ (User Interface)

| หน้า | URL | กลุ่มผู้ใช้ | ฟีเจอร์หลัก |
|------|-----|------------|-------------|
| **หน้าสั่งอาหาร (โต๊ะ)** | `/table/[tableNumber]` | ลูกค้าที่นั่งโต๊ะ | สั่งอาหารผ่าน QR Code, เลือกเมนู, ตะกร้า |
| **หน้า Kiosk** | `/kiosk` | ลูกค้าทั่วไป (walk-in) | สั่งแบบ dine-in/takeaway, เลือกวิธีชำระเงิน, รับบัตรคิว |
| **หน้าจัดการออเดอร์** | `/orders` | พ่อครัว / บริกร / Admin | ดูออเดอร์, จัดการสถานะ, ติดตามคิว |
| **หน้า Admin** | `/admin` | Admin | จัดการระบบ, จัดการเมนู, สร้าง QR Code |

### หน้าเสริมสำหรับ Kiosk

| หน้า | URL | รายละเอียด |
|------|-----|------------|
| แดชบอร์ดคิว | `/kiosk/dashboard` | แสดงสถิติและภาพรวมคิว |
| หน้าจอแสดงคิว | `/kiosk/display` | แสดงหมายเลขคิวที่กำลังเรียก (สำหรับจอทีวี) |
| จัดการคิว | `/kiosk/queue-management` | จัดการสถานะคิว, เรียกคิว |

## 📁 โครงสร้างโปรเจค

```
food-ordering-system/
├── app/
│   ├── globals.css              # CSS หลัก
│   ├── layout.tsx               # Root Layout
│   ├── page.tsx                 # หน้าหลัก
│   ├── orders/
│   │   └── page.tsx             # หน้าจัดการออเดอร์
│   ├── table/
│   │   └── [tableNumber]/
│   │       ├── page.tsx         # หน้าสั่งอาหารสำหรับโต๊ะ
│   │       └── TableOrderClient.tsx
│   ├── kiosk/
│   │   ├── page.tsx             # หน้า Kiosk หลัก
│   │   ├── dashboard/
│   │   │   └── page.tsx         # แดชบอร์ดคิว
│   │   ├── display/
│   │   │   └── page.tsx         # หน้าจอแสดงคิว
│   │   └── queue-management/
│   │       └── page.tsx         # จัดการคิว
│   └── admin/
│       ├── page.tsx             # หน้า Admin หลัก
│       ├── menu-management/
│       │   └── page.tsx         # จัดการเมนู
│       └── qr-codes/
│           └── page.tsx         # สร้าง QR Code
├── components/
│   ├── Header.tsx               # Header พร้อมปุ่มตะกร้า
│   ├── CategoryFilter.tsx       # ฟิลเตอร์หมวดหมู่
│   ├── MenuCard.tsx             # Card แสดงเมนูอาหาร
│   ├── CartSidebar.tsx          # Sidebar ตะกร้าสินค้า
│   ├── NestedMenuModal.tsx      # Modal เลือกตัวเลือกเมนู
│   ├── QueueTicketPrint.tsx     # พิมพ์บัตรคิว
│   └── ...
├── contexts/
│   └── LanguageContext.tsx      # Context สำหรับภาษา
├── data/
│   ├── menuItems.ts             # ข้อมูลเมนูอาหาร
│   └── nestedMenuOptions.ts     # ตัวเลือกเมนูแบบซ้อน
├── types/
│   └── index.ts                 # TypeScript Types
├── locales/                     # ไฟล์ภาษา (i18n)
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## 🎯 วิธีใช้งาน

### สำหรับลูกค้า (สั่งผ่านโต๊ะ)
1. **สแกน QR Code**: สแกน QR Code ที่โต๊ะเพื่อเข้าหน้าสั่งอาหาร
2. **เรียกดูเมนู**: เลือกหมวดหมู่ที่ต้องการหรือดูทั้งหมด
3. **เพิ่มสินค้า**: คลิกปุ่ม "เพิ่ม" ที่เมนูที่ต้องการ
4. **จัดการตะกร้า**: คลิกปุ่ม "ตะกร้า" เพื่อดูรายการสินค้า
5. **ปรับจำนวน**: ใช้ปุ่ม +/- เพื่อเพิ่มหรือลดจำนวน
6. **สั่งซื้อ**: คลิกปุ่ม "ยืนยันการสั่งซื้อ" เพื่อยืนยัน

### สำหรับลูกค้า (Kiosk)
1. **เริ่มต้น**: กดปุ่ม "เริ่มสั่งอาหาร" ที่หน้าจอ Kiosk
2. **เลือกประเภท**: เลือก "ทานที่ร้าน" หรือ "ซื้อกลับบ้าน"
3. **เลือกเมนู**: เลือกอาหารที่ต้องการและเพิ่มลงตะกร้า
4. **ตรวจสอบตะกร้า**: ตรวจสอบรายการและเพิ่มคำสั่งพิเศษ
5. **ชำระเงิน**: เลือกวิธีการชำระเงินและกรอกรหัสสมาชิก (ถ้ามี)
6. **รับบัตรคิว**: รับหมายเลขคิวและรอรับอาหาร

### สำหรับพนักงาน
1. **ดูออเดอร์**: เข้าหน้า `/orders` เพื่อดูรายการออเดอร์
2. **จัดการสถานะ**: อัพเดตสถานะออเดอร์ (กำลังทำ, เสร็จแล้ว)
3. **เรียกคิว**: ใช้หน้า `/kiosk/queue-management` เพื่อเรียกคิวลูกค้า
4. **แสดงคิว**: เปิดหน้า `/kiosk/display` บนจอทีวีเพื่อแสดงหมายเลขคิว

## 🛠️ เทคโนโลยีที่ใช้

- **Next.js 14** - React Framework
- **TypeScript** - Type Safety
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## 📝 การปรับแต่ง

### เพิ่มเมนูอาหารใหม่

แก้ไขไฟล์ `data/menuItems.ts`:

```typescript
{
  id: 13,
  name: 'ชื่อเมนู',
  category: 'หมวดหมู่',
  price: 100,
  image: 'URL รูปภาพ',
  description: 'รายละเอียด',
}
```

### เปลี่ยนสีธีม

แก้ไขไฟล์ `tailwind.config.ts` หรือใช้ Tailwind classes ในคอมโพเนนต์

### เชื่อมต่อ Backend API

แก้ไขฟังก์ชัน `confirmOrder` ใน `app/page.tsx` เพื่อส่งข้อมูลไปยัง API:

```typescript
const confirmOrder = async () => {
  try {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cart, totalAmount }),
    });
    // จัดการ response
  } catch (error) {
    console.error('Error:', error);
  }
};
```

## 📱 Screenshots

ระบบรองรับการแสดงผลแบบ Responsive ทั้งบนมือถือและคอมพิวเตอร์

## 🤝 การพัฒนาต่อยอด

สามารถเพิ่มฟีเจอร์เพิ่มเติมได้ เช่น:
- ระบบล็อกอิน/สมัครสมาชิก
- ประวัติการสั่งซื้อ
- ระบบชำระเงินออนไลน์ (Payment Gateway)
- แจ้งเตือนสถานะออเดอร์แบบ Real-time
- เชื่อมต่อกับเครื่องพิมพ์ใบเสร็จ/บัตรคิว
- ระบบสต็อกวัตถุดิบ
- รายงานยอดขาย
- รีวิวและให้คะแนนอาหาร

## 📄 License

MIT License - ใช้งานได้ตามต้องการ

### SETUP ###
docker build -t food-ordering-system:test .
