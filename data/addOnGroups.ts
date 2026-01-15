import { AddOnGroup } from '@/types';

export const addOnGroups: AddOnGroup[] = [
  // Beverage Sets
  {
    id: 1,
    name: 'เซ็ตเครื่องดื่มเย็น',
    description: 'น้ำมะนาว + ชาไทย (ประหยัดกว่า 10 บาท)',
    price: 45, // ราคาปกติ 30+25=55 บาท
    addOnIds: [8, 11], // ID ของ น้ำมะนาว และ ชาไทย จาก addOns
    category: 'beverage-set',
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop',
  },
  {
    id: 2,
    name: 'เซ็ตเครื่องดื่มคู่',
    description: 'เครื่องดื่ม 2 แก้ว (เลือกได้)',
    price: 50,
    addOnIds: [8, 8], // สามารถสั่งซ้ำได้
    category: 'beverage-set',
  },

  // Dessert Sets
  {
    id: 3,
    name: 'เซ็ตของหวาน',
    description: 'ไอศกรีมกะทิ + ข้าวเหนียวมะม่วง',
    price: 80, // ราคาปกติ 40+50=90 บาท
    addOnIds: [7, 12], // ID ของไอศกรีมกะทิ และข้าวเหนียวมะม่วง (ต้องอ้างถึง MenuItem)
    category: 'dessert-set',
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop',
  },

  // Protein Add-on Sets
  {
    id: 4,
    name: 'เซ็ตเพิ่มโปรตีน',
    description: 'ไข่ดาว + กุ้งเพิ่ม + หมูกรอบเพิ่ม',
    price: 60, // ราคาปกติ 10+30+25=65 บาท
    addOnIds: [1, 4, 5],
    category: 'protein-combo',
  },

  // Side Dish Sets
  {
    id: 5,
    name: 'เซ็ตเครื่องเคียง',
    description: 'ข้าวเปล่า + ผักสด + น้ำจิ้มรสเด็ด',
    price: 30, // ราคาปกติ 10+20+5=35 บาท
    addOnIds: [9, 11, 13],
    category: 'side-combo',
  },

  // Premium Combo
  {
    id: 6,
    name: 'เซ็ตพรีเมี่ยม',
    description: 'เพิ่มไข่ดาว + กุ้ง + เครื่องดื่ม',
    price: 65, // ประหยัด
    addOnIds: [1, 4, 8],
    category: 'premium-combo',
  },

  // Family Set
  {
    id: 7,
    name: 'เซ็ตครอบครัว',
    description: 'ข้าวเปล่า 4 จาน + ผักสด + น้ำจิ้ม 2 ชุด',
    price: 55,
    addOnIds: [9, 9, 9, 9, 11, 13, 14], // สั่งข้าวเปล่า 4 จาน
    category: 'family-combo',
  },

  // Breakfast Set
  {
    id: 8,
    name: 'เซ็ตอาหารเช้า',
    description: 'ไข่เจียว + ข้าวเปล่า + น้ำมะนาว',
    price: 50,
    addOnIds: [2, 9, 8],
    category: 'breakfast-combo',
  },
];
