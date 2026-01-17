# คู่มือติดตั้งบน Windows Server

## ข้อกำหนดเบื้องต้น
- Windows Server 2016 หรือใหม่กว่า
- Node.js v18 หรือใหม่กว่า
- Nginx for Windows

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

### 2. ติดตั้ง PM2 (Process Manager)

```cmd
npm install -g pm2
npm install -g pm2-windows-service
```

ติดตั้ง PM2 เป็น Windows Service:
```cmd
pm2-service-install -n PM2
```

### 3. Upload โปรเจกต์ไปยัง Server

1. Upload folder ทั้งหมดไปยัง Server (เช่น `C:\inetpub\food-ordering-system`)
2. ไม่ต้อง upload folder `node_modules` และ `.next`

### 4. ติดตั้ง Dependencies และ Build

เปิด Command Prompt หรือ PowerShell แล้ว cd ไปยัง folder โปรเจกต์:

```cmd
cd C:\inetpub\food-ordering-system

# ติดตั้ง dependencies
npm install --production

# Build โปรเจกต์
npm run build
```

### 5. สร้าง folder logs

```cmd
mkdir logs
```

### 6. เริ่มใช้งาน Next.js ด้วย PM2

```cmd
# เริ่มใช้งาน
pm2 start ecosystem.config.js

# ดู status
pm2 status

# ดู logs
pm2 logs food-ordering-system

# บันทึก PM2 list
pm2 save

# ตั้งให้ PM2 เริ่มต้นอัตโนมัติ
pm2 startup
```

ตอนนี้ Next.js จะทำงานที่ `http://localhost:3333`

### 7. ติดตั้ง Nginx for Windows

1. ดาวน์โหลด Nginx จาก http://nginx.org/en/download.html
   - เลือก version: nginx/Windows (เช่น nginx-1.24.0)

2. แตกไฟล์ไปยัง `C:\nginx`

3. คัดลอกไฟล์ `nginx.conf` ของเราไปแทนที่ไฟล์เดิม:
   ```cmd
   copy nginx.conf C:\nginx\conf\nginx.conf
   ```

4. แก้ไข path ใน `nginx.conf` ให้ตรงกับ path ของโปรเจกต์:
   - เปิดไฟล์ `C:\nginx\conf\nginx.conf`
   - แก้ไข `alias` ใน location blocks ให้ชี้ไปยัง folder โปรเจกต์ของคุณ

   ตัวอย่าง:
   ```nginx
   location /_next/static {
       alias C:/inetpub/food-ordering-system/.next/static;
       # ...
   }

   location /static {
       alias C:/inetpub/food-ordering-system/public;
       # ...
   }
   ```

5. ทดสอบ config:
   ```cmd
   cd C:\nginx
   nginx -t
   ```

6. เริ่มใช้งาน Nginx:
   ```cmd
   cd C:\nginx
   start nginx
   ```

### 8. ติดตั้ง Nginx เป็น Windows Service (แนะนำ)

ใช้ NSSM (Non-Sucking Service Manager):

1. ดาวน์โหลด NSSM จาก https://nssm.cc/download
2. แตกไฟล์และคัดลอก `nssm.exe` ไปยัง `C:\nginx`
3. เปิด Command Prompt แบบ Administrator:

```cmd
cd C:\nginx
nssm install nginx C:\nginx\nginx.exe
nssm set nginx AppDirectory C:\nginx
nssm set nginx AppParameters -c C:\nginx\conf\nginx.conf
nssm start nginx
```

---

## การจัดการ Services

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

# ดู logs แบบ real-time
pm2 logs food-ordering-system --lines 100
```

### Nginx Commands:
```cmd
# หยุด Nginx
nginx -s stop

# Restart Nginx (reload config)
nginx -s reload

# หยุดแบบ graceful
nginx -s quit

# ทดสอบ config
nginx -t

# เริ่มใหม่
cd C:\nginx
start nginx
```

### ถ้าติดตั้งเป็น Service:
```cmd
# เริ่มต้น
net start nginx
sc start nginx

# หยุด
net stop nginx
sc stop nginx

# Restart
net stop nginx && net start nginx
```

---

## การอัพเดทโปรเจกต์

เมื่อมีการแก้ไขโค้ด:

```cmd
cd C:\inetpub\food-ordering-system

# Pull code ใหม่ (ถ้าใช้ git)
git pull

# ติดตั้ง dependencies ใหม่ (ถ้ามี)
npm install --production

# Build ใหม่
npm run build

# Restart PM2
pm2 restart food-ordering-system

# Reload Nginx
nginx -s reload
```

---

## Firewall Settings

เปิด port 80 (HTTP) และ 443 (HTTPS) ใน Windows Firewall:

```cmd
# เปิด port 80
netsh advfirewall firewall add rule name="HTTP" dir=in action=allow protocol=TCP localport=80

# เปิด port 443 (สำหรับ HTTPS)
netsh advfirewall firewall add rule name="HTTPS" dir=in action=allow protocol=TCP localport=443
```

---

## ตรวจสอบการทำงาน

1. เปิดเว็บเบราว์เซอร์ไปที่ `http://localhost` หรือ `http://your-server-ip`
2. ควรเห็นหน้าเว็บแอพพลิเคชั่น Food Ordering System

---

## การ Monitor

### ดู CPU และ Memory ของ Node.js:
```cmd
pm2 monit
```

### ดู logs:
```cmd
# PM2 logs
pm2 logs

# Nginx access logs
type C:\nginx\logs\food-ordering-access.log

# Nginx error logs
type C:\nginx\logs\food-ordering-error.log

# Application logs
type C:\inetpub\food-ordering-system\logs\combined.log
```

---

## Troubleshooting

### 1. ไม่สามารถเข้าถึงเว็บได้
- ตรวจสอบว่า PM2 ทำงานอยู่: `pm2 status`
- ตรวจสอบว่า Nginx ทำงานอยู่: `tasklist | findstr nginx`
- ตรวจสอบ Firewall
- ดู error logs

### 2. หน้าเว็บแสดงผิดพลาด
- ดู PM2 logs: `pm2 logs food-ordering-system`
- ตรวจสอบว่า build สำเร็จ: ตรวจสอบ folder `.next`

### 3. Static files โหลดไม่ได้
- ตรวจสอบ path ใน `nginx.conf`
- Reload Nginx: `nginx -s reload`

### 4. Port 3333 ถูกใช้งานอยู่
- หา process ที่ใช้ port: `netstat -ano | findstr :3333`
- Kill process: `taskkill /PID <PID> /F`

---

## ติดตั้ง SSL Certificate (Optional)

สำหรับ HTTPS:

1. ซื้อ SSL Certificate หรือใช้ Let's Encrypt
2. วางไฟล์ certificate ที่ `C:\nginx\ssl\`
3. แก้ไข `nginx.conf` เปิด block HTTPS (uncomment)
4. Reload Nginx: `nginx -s reload`

---

## Performance Tuning

### เพิ่ม instances ของ Node.js:
แก้ไข `ecosystem.config.js`:
```javascript
instances: 2,  // เปลี่ยนจาก 1 เป็น 2 หรือมากกว่า
```

จากนั้น:
```cmd
pm2 restart food-ordering-system
```

### เพิ่ม worker processes ของ Nginx:
แก้ไข `nginx.conf`:
```nginx
worker_processes 2;  # เปลี่ยนตามจำนวน CPU cores
```

---

## Backup และ Recovery

### สิ่งที่ควร backup:
1. Source code: `C:\inetpub\food-ordering-system\`
2. PM2 config: `ecosystem.config.js`
3. Nginx config: `C:\nginx\conf\nginx.conf`
4. Environment variables: `.env`
5. Logs (ถ้าต้องการ)

### สคริปต์ backup อัตโนมัติ:
สร้างไฟล์ `backup.bat`:
```batch
@echo off
set BACKUP_DIR=D:\backups\food-ordering-%date:~-4,4%%date:~-10,2%%date:~-7,2%
mkdir %BACKUP_DIR%
xcopy C:\inetpub\food-ordering-system %BACKUP_DIR%\ /E /I /H /Y
echo Backup completed: %BACKUP_DIR%
```

ตั้ง Task Scheduler ให้รันทุกวัน

---

## ติดต่อสอบถาม

หากมีปัญหาในการติดตั้ง สามารถตรวจสอบ:
- PM2 logs: `pm2 logs`
- Nginx error logs: `C:\nginx\logs\food-ordering-error.log`
- Application logs: `logs\combined.log`
