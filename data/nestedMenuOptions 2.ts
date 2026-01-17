import { NestedMenuOption } from '@/types';

/**
 * Nested Menu Options Database
 * ตัวอย่างการสร้างเมนูแบบหลายชั้น (Multi-level Menu)
 *
 * โครงสร้าง:
 * - ชั้นที่ 1: ตัวเลือกหลัก (เช่น ประเภทเนื้อ)
 * - ชั้นที่ 2: ตัวเลือกรอง (เช่น ขนาดเนื้อ)
 * - ชั้นที่ 3: ตัวเลือกเพิ่มเติม (เช่น ระดับความสุก)
 */

export const nestedMenuOptions: NestedMenuOption[] = [
  // ========================================
  // ชั้นที่ 1: ประเภทเนื้อสำหรับสเต็ก
  // ========================================
  {
    id: 1,
    name: 'เนื้อวัว (Beef)',
    description: 'เนื้อวัวคุณภาพพรีเมี่ยม นุ่ม ฉ่ำ',
    price: 50,
    type: 'single',
    image: 'https://images.unsplash.com/photo-1558030006-450675393462?w=400&h=300&fit=crop',
    requireChildSelection: true,
    minChildSelections: 1,
    maxChildSelections: 1,
    childOptions: [
      // ชั้นที่ 2: ขนาดเนื้อ
      {
        id: 11,
        name: '200 กรัม',
        description: 'ขนาดมาตรฐาน เหมาะสำหรับ 1 ท่าน',
        price: 0,
        type: 'single',
        requireChildSelection: true,
        minChildSelections: 1,
        maxChildSelections: 1,
        childOptions: [
          // ชั้นที่ 3: ระดับความสุก
          {
            id: 111,
            name: 'Rare (สุกนิดหน่อย)',
            description: 'เนื้อสุกนอก ชมพูข้างใน',
            price: 0,
            type: 'single',
          },
          {
            id: 112,
            name: 'Medium (สุกปานกลาง)',
            description: 'เนื้อสุกพอดี นุ่ม ฉ่ำ',
            price: 0,
            type: 'single',
          },
          {
            id: 113,
            name: 'Well Done (สุกทั่ว)',
            description: 'เนื้อสุกทั้งชิ้น แน่น กรอบนอก',
            price: 0,
            type: 'single',
          },
        ],
      },
      {
        id: 12,
        name: '300 กรัม',
        description: 'ขนาดใหญ่ เหมาะสำหรับคนชอบทานเนื้อ',
        price: 100,
        type: 'single',
        requireChildSelection: true,
        minChildSelections: 1,
        maxChildSelections: 1,
        childOptions: [
          {
            id: 121,
            name: 'Rare (สุกนิดหน่อย)',
            description: 'เนื้อสุกนอก ชมพูข้างใน',
            price: 0,
            type: 'single',
          },
          {
            id: 122,
            name: 'Medium (สุกปานกลาง)',
            description: 'เนื้อสุกพอดี นุ่ม ฉ่ำ',
            price: 0,
            type: 'single',
          },
          {
            id: 123,
            name: 'Well Done (สุกทั่ว)',
            description: 'เนื้อสุกทั้งชิ้น แน่น กรอบนอก',
            price: 0,
            type: 'single',
          },
        ],
      },
    ],
  },
  {
    id: 2,
    name: 'เนื้อหมู (Pork)',
    description: 'เนื้อหมูสันนอก นุ่ม หวาน',
    price: 30,
    type: 'single',
    requireChildSelection: true,
    minChildSelections: 1,
    maxChildSelections: 1,
    childOptions: [
      {
        id: 21,
        name: '150 กรัม',
        description: 'ขนาดพอดีคำ',
        price: 0,
        type: 'single',
        requireChildSelection: true,
        minChildSelections: 1,
        maxChildSelections: 1,
        childOptions: [
          {
            id: 211,
            name: 'Medium (สุกปานกลาง)',
            description: 'เนื้อสุกพอดี นุ่ม ฉ่ำ',
            price: 0,
            type: 'single',
          },
          {
            id: 212,
            name: 'Well Done (สุกทั่ว)',
            description: 'เนื้อสุกทั้งชิ้น',
            price: 0,
            type: 'single',
          },
        ],
      },
      {
        id: 22,
        name: '250 กรัม',
        description: 'ขนาดใหญ่',
        price: 50,
        type: 'single',
        requireChildSelection: true,
        minChildSelections: 1,
        maxChildSelections: 1,
        childOptions: [
          {
            id: 221,
            name: 'Medium (สุกปานกลาง)',
            description: 'เนื้อสุกพอดี นุ่ม ฉ่ำ',
            price: 0,
            type: 'single',
          },
          {
            id: 222,
            name: 'Well Done (สุกทั่ว)',
            description: 'เนื้อสุกทั้งชิ้น',
            price: 0,
            type: 'single',
          },
        ],
      },
    ],
  },
  {
    id: 3,
    name: 'เนื้อไก่ (Chicken)',
    description: 'เนื้ออกไก่ หนังกรอบ เนื้อนุ่ม',
    price: 20,
    type: 'single',
    requireChildSelection: false, // ไม่บังคับเลือกชั้นถัดไป
    minChildSelections: 0,
    maxChildSelections: 2, // เลือกได้สูงสุด 2 อย่าง
    childOptions: [
      {
        id: 31,
        name: 'หนังกรอบพิเศษ',
        description: 'ทอดหนังให้กรอบพิเศษ',
        price: 15,
        type: 'single',
      },
      {
        id: 32,
        name: 'ราดซอสพริกไทยดำ',
        description: 'ซอสพริกไทยดำรสเด็ด',
        price: 20,
        type: 'single',
      },
      {
        id: 33,
        name: 'เพิ่มเห็ด',
        description: 'เห็ดผัดเนย หอมกรุ่น',
        price: 25,
        type: 'single',
      },
    ],
  },

  // ========================================
  // ชั้นที่ 1: ประเภทพาสต้า
  // ========================================
  {
    id: 4,
    name: 'คาโบนาร่า (Carbonara)',
    description: 'ซอสครีมเข้มข้น เบคอนกรอบ',
    price: 40,
    type: 'single',
    image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400&h=300&fit=crop',
    requireChildSelection: true,
    minChildSelections: 1,
    maxChildSelections: 1,
    childOptions: [
      {
        id: 41,
        name: 'สปาเก็ตตี้',
        description: 'เส้นกลม คลาสสิก',
        price: 0,
        type: 'single',
        requireChildSelection: false,
        minChildSelections: 0,
        maxChildSelections: 3,
        childOptions: [
          {
            id: 411,
            name: 'เพิ่มเบคอน',
            description: 'เบคอนกรอบพิเศษ',
            price: 30,
            type: 'single',
          },
          {
            id: 412,
            name: 'เพิ่มพาร์เมซาน',
            description: 'ชีสพาร์เมซานขูด',
            price: 20,
            type: 'single',
          },
          {
            id: 413,
            name: 'เพิ่มไข่ออนเซ็น',
            description: 'ไข่ออนเซ็นกลมกล่อม',
            price: 25,
            type: 'single',
          },
        ],
      },
      {
        id: 42,
        name: 'เฟตตูชีนี',
        description: 'เส้นแบน หนานุ่ม',
        price: 10,
        type: 'single',
        requireChildSelection: false,
        minChildSelections: 0,
        maxChildSelections: 3,
        childOptions: [
          {
            id: 421,
            name: 'เพิ่มเบคอน',
            description: 'เบคอนกรอบพิเศษ',
            price: 30,
            type: 'single',
          },
          {
            id: 422,
            name: 'เพิ่มพาร์เมซาน',
            description: 'ชีสพาร์เมซานขูด',
            price: 20,
            type: 'single',
          },
        ],
      },
    ],
  },
  {
    id: 5,
    name: 'มาริน่าร่า (Marinara)',
    description: 'ซอสมะเขือเทศ รสชาติต้นตำรับอิตาลี',
    price: 35,
    type: 'single',
    requireChildSelection: true,
    minChildSelections: 1,
    maxChildSelections: 1,
    childOptions: [
      {
        id: 51,
        name: 'สปาเก็ตตี้',
        description: 'เส้นกลม คลาสสิก',
        price: 0,
        type: 'single',
      },
      {
        id: 52,
        name: 'เพนเน่',
        description: 'เส้นสั้น รูปท่อ',
        price: 5,
        type: 'single',
      },
    ],
  },

  // ========================================
  // ชั้นที่ 1: ประเภทพิซซ่า (Group Menu Example)
  // ========================================
  {
    id: 6,
    name: 'พิซซ่าหน้าพิเศษ (Premium Pizza)',
    description: 'พิซซ่าหน้าพิเศษ ชีสเยอะ',
    price: 100,
    type: 'group',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop',
    requireChildSelection: true,
    minChildSelections: 2, // ต้องเลือกอย่างน้อย 2 หน้า
    maxChildSelections: 4, // เลือกได้สูงสุด 4 หน้า
    childOptions: [
      {
        id: 61,
        name: 'หน้าเปปเปอโรนี',
        description: 'เนื้อเปปเปอโรนี รสชาติจัดจ้าน',
        price: 50,
        type: 'single',
      },
      {
        id: 62,
        name: 'หน้าฮาวายเอี้ยน',
        description: 'แฮม สับปะรด รสชาติหวานมัน',
        price: 45,
        type: 'single',
      },
      {
        id: 63,
        name: 'หน้าซีฟู้ด',
        description: 'กุ้ง ปู หอย สดใหม่',
        price: 80,
        type: 'single',
      },
      {
        id: 64,
        name: 'หน้าผักรวม',
        description: 'ผักสดๆ มากมาย',
        price: 40,
        type: 'single',
      },
      {
        id: 65,
        name: 'หน้า 4 ชีส',
        description: 'ชีส 4 ชนิด เข้มข้น หอมหวาน',
        price: 60,
        type: 'single',
      },
    ],
  },
];

// Helper function: ค้นหา option จาก ID
export function findNestedOptionById(id: number, options: NestedMenuOption[] = nestedMenuOptions): NestedMenuOption | null {
  for (const option of options) {
    if (option.id === id) {
      return option;
    }
    if (option.childOptions) {
      const found = findNestedOptionById(id, option.childOptions);
      if (found) return found;
    }
  }
  return null;
}

// Helper function: คำนวณราคารวมจาก selections
export function calculateNestedMenuPrice(selections: any[]): number {
  let total = 0;

  function addPrice(sel: any) {
    if (sel.option && sel.option.price) {
      total += sel.option.price;
    }
    if (sel.childSelections && sel.childSelections.length > 0) {
      sel.childSelections.forEach((child: any) => addPrice(child));
    }
  }

  selections.forEach(sel => addPrice(sel));
  return total;
}
