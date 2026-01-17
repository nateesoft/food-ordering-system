# คู่มือติดตั้งบน Windows Server ด้วย IIS 7+

## ข้อกำหนดเบื้องต้น
- Windows Server 2008 R2 หรือใหม่กว่า (IIS 7+)
- Node.js v18 หรือใหม่กว่า
- IIS 7 หรือใหม่กว่า (มีอยู่แล้ว)

---

## ขั้นตอนการติดตั้ง

### 1. ติดตั้ง Node.js

1. ดาวน์โหลด Node.js จาก https://nodejs.org/
2. ติดตั้ง Node.js (เลือก LTS version)
3. ตรวจสอบการติดตั้ง:
   ```cmd
   node --version
   npm --version
   ```

### 2. ติดตั้ง iisnode (สำคัญมาก!)

**iisnode** เป็น module ที่ทำให้ IIS สามารถรัน Node.js application ได้

1. ดาวน์โหลด iisnode จาก:
   - https://github.com/Azure/iisnode/releases
   - เลือก version ที่ตรงกับระบบของคุณ (x64 หรือ x86)

2. ติดตั้ง iisnode โดยรัน installer

3. ตรวจสอบการติดตั้ง:
   - เปิด IIS Manager
   - เลือก Server หรือ Site
   - ดูว่ามี icon "iisnode" ปรากฏหรือไม่

### 3. ติดตั้ง URL Rewrite Module

1. ดาวน์โหลดจาก:
   - https://www.iis.net/downloads/microsoft/url-rewrite

2. ติดตั้ง URL Rewrite Module

3. Restart IIS:
   ```cmd
   iisreset
   ```

### 4. ติดตั้ง PM2 (สำหรับจัดการ Process)

```cmd
npm install -g pm2
npm install -g pm2-windows-service
```

ติดตั้ง PM2 เป็น Windows Service:
```cmd
pm2-service-install -n PM2
```

### 5. Upload โปรเจกต์ไปยัง Server

1. Upload folder ทั้งหมดไปยัง Server (เช่น `C:\inetpub\wwwroot\food-ordering-system`)
2. ไม่ต้อง upload folder `node_modules` และ `.next`

ตัวอย่าง path:
```
C:\inetpub\wwwroot\food-ordering-system\
├── .next/
├── components/
├── contexts/
├── locales/
├── node_modules/
├── public/
├── types/
├── .env
├── ecosystem.config.js
├── web.config          <- ไฟล์สำคัญสำหรับ IIS
├── package.json
└── ...
```

### 6. ติดตั้ง Dependencies และ Build

เปิด Command Prompt หรือ PowerShell แบบ Administrator:

```cmd
cd C:\inetpub\wwwroot\food-ordering-system

# ติดตั้ง dependencies
npm install --production

# Build โปรเจกต์
npm run build

# สร้าง folder logs
mkdir logs
```

### 7. เริ่มใช้งาน Node.js ด้วย PM2

```cmd
cd C:\inetpub\wwwroot\food-ordering-system

# เริ่มใช้งาน
pm2 start ecosystem.config.js

# ดู status
pm2 status

# บันทึก PM2 list
pm2 save

# ตั้งให้ PM2 เริ่มต้นอัตโนมัติ
pm2 startup
```

ตอนนี้ Node.js จะทำงานที่ `http://localhost:3333`

### 8. สร้าง Website ใน IIS

#### วิธีที่ 1: ใช้ IIS Manager (GUI)

1. เปิด **IIS Manager**
2. คลิกขวาที่ **Sites** > เลือก **Add Website**
3. กรอกข้อมูล:
   - **Site name**: `FoodOrderingSystem`
   - **Physical path**: `C:\inetpub\wwwroot\food-ordering-system`
   - **Binding**:
     - Type: `http`
     - Port: `80` (หรือ port ที่ต้องการ)
     - Host name: (ว่างไว้ หรือใส่ domain name ถ้ามี)
4. คลิก **OK**

#### วิธีที่ 2: ใช้ Command Line

```cmd
cd C:\Windows\System32\inetsrv

# สร้าง Application Pool
appcmd add apppool /name:"FoodOrderingAppPool" /managedRuntimeVersion:""

# สร้าง Site
appcmd add site /name:"FoodOrderingSystem" /physicalPath:"C:\inetpub\wwwroot\food-ordering-system" /bindings:http/*:80:

# ตั้ง Application Pool ให้ Site
appcmd set app "FoodOrderingSystem/" /applicationPool:"FoodOrderingAppPool"

# เริ่มต้น Site
appcmd start site /site.name:"FoodOrderingSystem"
```

### 9. ตั้งค่า Application Pool

1. ใน IIS Manager เลือก **Application Pools**
2. คลิกขวาที่ `FoodOrderingAppPool` > **Basic Settings**
3. ตั้งค่า:
   - **.NET CLR version**: `No Managed Code`
   - **Managed pipeline mode**: `Integrated`
4. คลิกขวาอีกครั้ง > **Advanced Settings**
5. ตั้งค่า:
   - **Start Mode**: `AlwaysRunning`
   - **Idle Time-out**: `0` (ไม่ timeout)

### 10. ตั้งค่า Permissions

ให้สิทธิ์ IIS อ่านไฟล์ในโปรเจกต์:

```cmd
cd C:\inetpub\wwwroot\food-ordering-system

# ให้สิทธิ์ IIS_IUSRS
icacls . /grant "IIS_IUSRS:(OI)(CI)F" /T

# ให้สิทธิ์ IUSR
icacls . /grant "IUSR:(OI)(CI)F" /T
```

### 11. ตรวจสอบไฟล์ web.config

ตรวจสอบว่ามีไฟล์ `web.config` ในโปรเจกต์ (ผมสร้างให้แล้ว)

ไฟล์นี้จะทำหน้าที่:
- Reverse Proxy จาก IIS ไปยัง Node.js (port 3333)
- ตั้งค่า Security Headers
- ตั้งค่า Compression และ Caching

---

## การตรวจสอบการทำงาน

### 1. ตรวจสอบว่า Node.js ทำงาน:
```cmd
pm2 status
```

ควรเห็น `food-ordering-system` status เป็น `online`

### 2. ทดสอบ Node.js โดยตรง:
เปิดเว็บเบราว์เซอร์ไปที่ `http://localhost:3333`

ควรเห็นหน้าเว็บแอพพลิเคชั่น

### 3. ทดสอบผ่าน IIS:
เปิดเว็บเบราว์เซอร์ไปที่:
- `http://localhost` (ถ้าใช้ port 80)
- `http://your-server-ip`
- `http://your-domain.com` (ถ้ามี domain)

---

## Firewall Settings

เปิด port ใน Windows Firewall:

```cmd
# เปิด port 80 (HTTP)
netsh advfirewall firewall add rule name="HTTP" dir=in action=allow protocol=TCP localport=80

# เปิด port 443 (HTTPS)
netsh advfirewall firewall add rule name="HTTPS" dir=in action=allow protocol=TCP localport=443
```

---

## การจัดการและ Monitoring

### PM2 Commands:
```cmd
# ดู status
pm2 status

# Restart
pm2 restart food-ordering-system

# Stop
pm2 stop food-ordering-system

# ดู logs
pm2 logs food-ordering-system

# ดู monitoring
pm2 monit
```

### IIS Commands:
```cmd
# Restart IIS
iisreset

# หยุด Site
appcmd stop site /site.name:"FoodOrderingSystem"

# เริ่ม Site
appcmd start site /site.name:"FoodOrderingSystem"

# ดู Sites ทั้งหมด
appcmd list site

# ดู Application Pools
appcmd list apppool
```

### ดู Logs:

**IIS Logs:**
```
C:\inetpub\logs\LogFiles\W3SVC1\
```

**Application Logs:**
```
C:\inetpub\wwwroot\food-ordering-system\logs\
```

**PM2 Logs:**
```cmd
pm2 logs food-ordering-system
```

---

## การอัพเดทโปรเจกต์

เมื่อมีการแก้ไขโค้ด:

```cmd
cd C:\inetpub\wwwroot\food-ordering-system

# Pull code ใหม่ (ถ้าใช้ git)
git pull

# ติดตั้ง dependencies ใหม่ (ถ้ามี)
npm install --production

# Build ใหม่
npm run build

# Restart PM2
pm2 restart food-ordering-system

# Recycle Application Pool (optional)
appcmd recycle apppool /apppool.name:"FoodOrderingAppPool"
```

---

## ติดตั้ง SSL Certificate (HTTPS)

### วิธีที่ 1: ใช้ IIS Manager

1. เปิด **IIS Manager**
2. เลือก Server > **Server Certificates**
3. คลิก **Import...** (ถ้ามี certificate แล้ว) หรือ **Create Certificate Request...**
4. หลังจากได้ certificate แล้ว:
   - เลือก Site > **Bindings**
   - คลิก **Add**
   - Type: `https`
   - Port: `443`
   - SSL certificate: เลือก certificate ที่ import
   - คลิก **OK**

### วิธีที่ 2: ใช้ Command Line

```cmd
# Add HTTPS binding
appcmd set site /site.name:"FoodOrderingSystem" /+bindings.[protocol='https',bindingInformation='*:443:']

# Bind SSL Certificate (ต้องมี certificate thumbprint)
netsh http add sslcert ipport=0.0.0.0:443 certhash=CERTIFICATE_THUMBPRINT appid={GUID}
```

---

## Troubleshooting

### 1. HTTP Error 500.0 - Internal Server Error

**สาเหตุ:** iisnode ไม่สามารถเริ่ม Node.js ได้

**แก้ไข:**
- ตรวจสอบว่าติดตั้ง iisnode แล้ว
- ตรวจสอบว่า Node.js ติดตั้งถูกต้อง: `node --version`
- ตรวจสอบ permissions ของ folder
- ดู logs ใน `C:\inetpub\wwwroot\food-ordering-system\iisnode\`

### 2. HTTP Error 502.3 - Bad Gateway

**สาเหตุ:** IIS ไม่สามารถเชื่อมต่อกับ Node.js ที่ port 3333

**แก้ไข:**
- ตรวจสอบว่า PM2 ทำงานอยู่: `pm2 status`
- ตรวจสอบว่า Node.js ฟัง port 3333: `netstat -ano | findstr :3333`
- เริ่ม Node.js ใหม่: `pm2 restart food-ordering-system`

### 3. HTTP Error 500.19 - Internal Server Error

**สาเหตุ:** web.config มีปัญหา

**แก้ไข:**
- ตรวจสอบ syntax ใน web.config
- ตรวจสอบว่าติดตั้ง URL Rewrite Module แล้ว
- ลองใช้ web.config แบบง่าย:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="ReverseProxy" stopProcessing="true">
          <match url="(.*)" />
          <action type="Rewrite" url="http://localhost:3333/{R:1}" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

### 4. Static Files (CSS, JS, Images) ไม่โหลด

**สาเหตุ:** MIME types หรือ permissions

**แก้ไข:**
- ตรวจสอบ permissions
- เพิ่ม MIME types ใน IIS
- ตรวจสอบ web.config

### 5. Application Pool หยุดทำงานบ่อย

**แก้ไข:**
- เพิ่ม memory limit:
  - Application Pool > Advanced Settings
  - Regular Time Interval: `0` (disable recycling)
  - Private Memory Limit: `0` (unlimited)
- ตั้งค่า Rapid-Fail Protection:
  - Failure Interval: `5` minutes
  - Maximum Failures: `10`

### 6. ไม่สามารถเข้าถึงจากเครื่องอื่นได้

**แก้ไข:**
- ตรวจสอบ Windows Firewall
- ตรวจสอบ binding ใน IIS (ต้องเป็น `*` หรือ IP ของ server)
- ตรวจสอบว่า Site เริ่มทำงานแล้ว

---

## Performance Tuning

### 1. เพิ่ม Node.js Instances

แก้ไข `ecosystem.config.js`:
```javascript
instances: 2,  // หรือมากกว่า
```

จากนั้น:
```cmd
pm2 restart food-ordering-system
```

### 2. ตั้งค่า IIS Compression

1. ใน IIS Manager เลือก Server
2. Double-click **Compression**
3. เปิดทั้ง **Static** และ **Dynamic** compression

### 3. ตั้งค่า IIS Output Caching

1. เลือก Site > **Output Caching**
2. สร้าง caching rules สำหรับ static files

### 4. เพิ่ม Application Pool Workers

1. Application Pool > Advanced Settings
2. **Maximum Worker Processes**: `2` หรือมากกว่า (Web Garden)

---

## Backup และ Recovery

### สิ่งที่ควร backup:

1. **Source code**: `C:\inetpub\wwwroot\food-ordering-system\`
2. **IIS Configuration**:
   ```cmd
   appcmd list site /config /xml > C:\backup\iis-sites.xml
   appcmd list apppool /config /xml > C:\backup\iis-apppools.xml
   ```
3. **PM2 Configuration**: `ecosystem.config.js`
4. **Environment variables**: `.env`
5. **SSL Certificates** (ถ้ามี)

### Restore:

```cmd
# Restore IIS Sites
appcmd add site /in < C:\backup\iis-sites.xml

# Restore Application Pools
appcmd add apppool /in < C:\backup\iis-apppools.xml
```

---

## สรุปขั้นตอนสำคัญ

1. ติดตั้ง Node.js + PM2
2. ติดตั้ง iisnode + URL Rewrite Module
3. Upload โปรเจกต์และ build
4. เริ่ม Node.js ด้วย PM2 (port 3333)
5. สร้าง Site ใน IIS + ใช้ไฟล์ web.config
6. ตั้งค่า Permissions
7. ทดสอบการทำงาน

---

## เอกสารอ้างอิง

- iisnode: https://github.com/Azure/iisnode
- URL Rewrite: https://www.iis.net/downloads/microsoft/url-rewrite
- PM2: https://pm2.keymetrics.io/
- IIS Documentation: https://docs.microsoft.com/en-us/iis/

---

## ติดต่อสอบถาม

หากมีปัญหาในการติดตั้ง สามารถตรวจสอบ:
- PM2 logs: `pm2 logs`
- IIS logs: `C:\inetpub\logs\LogFiles\`
- Application logs: `logs\combined.log`
- iisnode logs: `iisnode\` (ถ้ามี)
