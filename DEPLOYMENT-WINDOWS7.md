# คู่มือติดตั้งบน Windows 7 (Static Export)

## ⚠️ ข้อจำกัดของ Windows 7

Windows 7 ไม่รองรับ Node.js เวอร์ชันใหม่ (v14+) ซึ่ง Next.js 14 ต้องการ Node.js v18+

**วิธีแก้:** Build โปรเจกต์บนเครื่องอื่น (Windows 10/11, Mac, Linux) แล้ว export เป็น Static HTML และนำไป deploy บน Windows 7

---

## ขั้นตอนการ Deploy

### Part 1: Build บนเครื่องที่มี Node.js v18+ (เครื่อง Developer)

#### 1. แก้ไข next.config.js เพื่อเปิดใช้ Static Export

สร้างหรือแก้ไขไฟล์ `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

module.exports = nextConfig;
```

#### 2. Build และ Export โปรเจกต์

```bash
# ติดตั้ง dependencies
npm install

# Build และ export
npm run build
```

หลังจาก build เสร็จ จะได้ folder `out/` ที่มี static files ทั้งหมด

#### 3. ตรวจสอบไฟล์ที่ได้

```
out/
├── _next/
│   ├── static/
│   └── ...
├── index.html
└── ...
```

#### 4. Zip folder `out/` เพื่อนำไป deploy

---

### Part 2: Deploy บน Windows 7 (IIS 7)

#### 1. ติดตั้ง IIS 7

ถ้ายังไม่ได้ติดตั้ง:

1. เปิด **Control Panel**
2. **Programs and Features**
3. **Turn Windows features on or off**
4. เลือก **Internet Information Services**
5. เลือก:
   - Web Management Tools > IIS Management Console
   - World Wide Web Services > Application Development Features > (เลือกทั้งหมด)
   - World Wide Web Services > Common HTTP Features > (เลือกทั้งหมด)
6. คลิก OK และรอติดตั้ง

#### 2. ติดตั้ง URL Rewrite Module (สำคัญ!)

1. ดาวน์โหลดจาก: https://www.iis.net/downloads/microsoft/url-rewrite
2. เลือก version สำหรับ IIS 7
3. ติดตั้งและ restart IIS

#### 3. Upload Static Files

1. แตกไฟล์ zip `out/` ไปยัง folder เช่น:
   ```
   C:\inetpub\wwwroot\food-ordering-system\
   ```

2. ตรวจสอบว่ามีไฟล์ `index.html` และ folder `_next/` อยู่

#### 4. สร้างไฟล์ web.config

สร้างไฟล์ `web.config` ใน folder `C:\inetpub\wwwroot\food-ordering-system\`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <!-- URL Rewrite Rules for SPA -->
    <rewrite>
      <rules>
        <!-- Serve static files directly -->
        <rule name="Static Files" stopProcessing="true">
          <match url="^(_next|static)/.*" />
          <action type="None" />
        </rule>

        <!-- Handle client-side routing -->
        <rule name="React Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/index.html" />
        </rule>
      </rules>
    </rewrite>

    <!-- MIME Types -->
    <staticContent>
      <mimeMap fileExtension=".json" mimeType="application/json" />
      <mimeMap fileExtension=".woff" mimeType="application/font-woff" />
      <mimeMap fileExtension=".woff2" mimeType="application/font-woff2" />
      <mimeMap fileExtension=".svg" mimeType="image/svg+xml" />
    </staticContent>

    <!-- Compression -->
    <urlCompression doStaticCompression="true" doDynamicCompression="true" />

    <!-- Security Headers -->
    <httpProtocol>
      <customHeaders>
        <add name="X-Content-Type-Options" value="nosniff" />
        <add name="X-Frame-Options" value="SAMEORIGIN" />
        <add name="X-XSS-Protection" value="1; mode=block" />
      </customHeaders>
    </httpProtocol>

    <!-- Caching for Static Files -->
    <staticContent>
      <clientCache cacheControlMode="UseMaxAge" cacheControlMaxAge="365.00:00:00" />
    </staticContent>
  </system.webServer>
</configuration>
```

#### 5. สร้าง Website ใน IIS

**วิธีที่ 1: ใช้ IIS Manager**

1. เปิด **IIS Manager** (Start > Run > inetmgr)
2. คลิกขวาที่ **Sites** > **Add Website**
3. กรอกข้อมูล:
   - **Site name**: `FoodOrderingSystem`
   - **Physical path**: `C:\inetpub\wwwroot\food-ordering-system`
   - **Binding**:
     - Type: `http`
     - Port: `80` (หรือ port อื่นที่ต้องการ)
     - Host name: (ว่างไว้)
4. คลิก **OK**

**วิธีที่ 2: ใช้ Command Line**

เปิด Command Prompt แบบ Administrator:

```cmd
cd C:\Windows\System32\inetsrv

# สร้าง Application Pool
appcmd add apppool /name:"FoodOrderingAppPool"

# สร้าง Site
appcmd add site /name:"FoodOrderingSystem" /physicalPath:"C:\inetpub\wwwroot\food-ordering-system" /bindings:http/*:80:

# ตั้ง Application Pool
appcmd set app "FoodOrderingSystem/" /applicationPool:"FoodOrderingAppPool"

# เริ่มต้น Site
appcmd start site /site.name:"FoodOrderingSystem"
```

#### 6. ตั้งค่า Permissions

```cmd
cd C:\inetpub\wwwroot\food-ordering-system

# ให้สิทธิ์ IIS อ่านไฟล์
icacls . /grant "IIS_IUSRS:(OI)(CI)R" /T
icacls . /grant "IUSR:(OI)(CI)R" /T
```

#### 7. ตั้งค่า Default Document

1. ใน IIS Manager เลือก Site
2. Double-click **Default Document**
3. ตรวจสอบว่ามี `index.html` ในรายการ
4. ถ้าไม่มี ให้คลิก **Add** และใส่ `index.html`

#### 8. Restart IIS

```cmd
iisreset
```

---

## ตรวจสอบการทำงาน

1. เปิดเว็บเบราว์เซอร์
2. ไปที่ `http://localhost` หรือ `http://your-computer-ip`
3. ควรเห็นหน้าเว็บ Food Ordering System

---

## Firewall Settings

เปิด port 80 ใน Windows Firewall:

1. **Control Panel** > **Windows Firewall**
2. **Advanced Settings**
3. **Inbound Rules** > **New Rule**
4. เลือก **Port** > Next
5. เลือก **TCP** และใส่ port `80` > Next
6. เลือก **Allow the connection** > Next
7. เลือก profile ทั้งหมด > Next
8. ตั้งชื่อ "HTTP" > Finish

หรือใช้ Command Line:

```cmd
netsh advfirewall firewall add rule name="HTTP" dir=in action=allow protocol=TCP localport=80
```

---

## การอัพเดทโปรเจกต์

เมื่อมีการแก้ไขโค้ด:

1. **Build ใหม่บนเครื่อง Developer:**
   ```bash
   npm run build
   ```

2. **Backup folder เดิม:**
   ```cmd
   cd C:\inetpub\wwwroot
   rename food-ordering-system food-ordering-system-backup
   ```

3. **Upload folder `out/` ใหม่**
   - แตก zip ไปยัง `C:\inetpub\wwwroot\food-ordering-system\`
   - คัดลอกไฟล์ `web.config` กลับมา (จาก backup)

4. **Restart IIS:**
   ```cmd
   iisreset
   ```

---

## Troubleshooting

### 1. HTTP Error 404 - File Not Found

**สาเหตุ:** ไฟล์ไม่ถูกต้อง หรือ permissions

**แก้ไข:**
- ตรวจสอบว่ามีไฟล์ `index.html` ใน folder
- ตรวจสอบ permissions
- ตรวจสอบว่า Default Document มี `index.html`

### 2. HTTP Error 500.19 - web.config มีปัญหา

**สาเหตุ:** ไม่ได้ติดตั้ง URL Rewrite Module

**แก้ไข:**
- ติดตั้ง URL Rewrite Module
- หรือใช้ web.config แบบง่ายที่ไม่มี rewrite rules

### 3. Static files (CSS, JS) ไม่โหลด

**สาเหตุ:** MIME types หรือ permissions

**แก้ไข:**
- ตรวจสอบ MIME types ใน IIS
- ตรวจสอบ permissions ของ folder `_next/`

### 4. หน้าเว็บแสดงผลไม่ถูกต้อง

**สาเหตุ:** การ build ไม่สมบูรณ์

**แก้ไข:**
- ลบ folder `.next/` และ `out/` บนเครื่อง developer
- Build ใหม่: `npm run build`
- Upload folder `out/` ใหม่

### 5. ไม่สามารถเข้าถึงจากเครื่องอื่นได้

**แก้ไข:**
- ตรวจสอบ Windows Firewall
- ตรวจสอบว่า Site binding เป็น `*` (all IP addresses)
- ตรวจสอบว่า Site เริ่มทำงานแล้ว: `appcmd list site`

---

## Performance Tuning

### 1. เปิดใช้งาน Static Compression

1. ใน IIS Manager เลือก Server
2. Double-click **Compression**
3. เปิด **Enable static content compression**
4. คลิก **Apply**

### 2. เปิดใช้งาน Output Caching

1. เลือก Site > **Output Caching**
2. คลิก **Add...**
3. กรอก:
   - File name extension: `*`
   - User-mode caching: **Cache until change**
4. คลิก **OK**

### 3. ตั้งค่า Browser Caching

แก้ไข `web.config` เพิ่ม:

```xml
<staticContent>
  <clientCache cacheControlMode="UseMaxAge" cacheControlMaxAge="365.00:00:00" />
</staticContent>
```

---

## ข้อดีและข้อเสียของ Static Export

### ✅ ข้อดี:

1. **รันได้บน Windows 7** - ไม่ต้องการ Node.js บน server
2. **รวดเร็ว** - ไฟล์ static โหลดเร็วมาก
3. **ปลอดภัย** - ไม่มี server-side code ที่เสี่ยง
4. **ง่ายต่อการ Deploy** - แค่ upload ไฟล์
5. **รองรับ Web Server ทั่วไป** - Apache, Nginx, IIS

### ⚠️ ข้อจำกัด:

1. **ไม่มี Server-side Rendering (SSR)**
2. **ไม่มี API Routes**
3. **ไม่มี Dynamic Routes** (ต้อง pre-generate ทั้งหมด)
4. **ไม่มี Incremental Static Regeneration (ISR)**

**สำหรับโปรเจกต์นี้:** ไม่มีปัญหา เพราะเป็น Client-side application ล้วนๆ

---

## ทางเลือกอื่นๆ

### 1. ใช้ Apache แทน IIS

ถ้าไม่อยากใช้ IIS สามารถติดตั้ง Apache for Windows:

1. ดาวน์โหลด XAMPP หรือ Apache
2. Upload ไฟล์ไปยัง `htdocs/`
3. สร้างไฟล์ `.htaccess`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Serve static files
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  # Fallback to index.html
  RewriteRule ^ index.html [L]
</IfModule>
```

### 2. Upgrade OS (แนะนำที่สุด)

ถ้าเป็นไปได้ แนะนำให้ upgrade เป็น:
- **Windows 10** (ยังมี support ถึง ตุลาคม 2025)
- **Windows 11**
- **Windows Server 2012 R2+**

แล้วสามารถใช้ Node.js และ deploy แบบเต็มรูปแบบได้

---

## สรุป

สำหรับ Windows 7:
1. **Build บนเครื่องอื่น** ที่มี Node.js v18+
2. **Export เป็น Static HTML** (folder `out/`)
3. **Deploy บน IIS 7** ด้วย web.config ที่สร้างให้
4. **เข้าถึงได้ทันที** ไม่ต้องการ Node.js บน server

---

## Script สำหรับ Auto Deploy

สร้างไฟล์ `deploy.bat` บนเครื่อง Developer:

```batch
@echo off
echo Building project...
call npm run build

echo Zipping output...
cd out
tar -a -c -f ../food-ordering-system.zip *
cd ..

echo Done! Upload food-ordering-system.zip to Windows 7 server
pause
```

สร้างไฟล์ `update.bat` บน Windows 7:

```batch
@echo off
set TARGET_DIR=C:\inetpub\wwwroot\food-ordering-system
set BACKUP_DIR=C:\inetpub\wwwroot\food-ordering-system-backup

echo Stopping IIS...
iisreset /stop

echo Backing up...
if exist %BACKUP_DIR% rmdir /s /q %BACKUP_DIR%
move %TARGET_DIR% %BACKUP_DIR%

echo Extracting new files...
mkdir %TARGET_DIR%
cd %TARGET_DIR%
tar -x -f %~dp0food-ordering-system.zip

echo Copying web.config...
copy %BACKUP_DIR%\web.config %TARGET_DIR%\

echo Starting IIS...
iisreset /start

echo Update completed!
pause
```

---

## ติดต่อสอบถาม

หากมีปัญหา:
1. ตรวจสอบ IIS logs: `C:\inetpub\logs\LogFiles\`
2. ตรวจสอบว่า URL Rewrite Module ติดตั้งแล้ว
3. ตรวจสอบ permissions ของ folder
