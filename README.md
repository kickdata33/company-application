# ระบบสมัครเปิดบริษัท

## ฟังก์ชัน
- `/apply` ผู้สมัครกรอกชื่อไทย/อังกฤษ อัปโหลดบัตรหน้า-หลัง ทะเบียนบ้าน และกรอกความถนัด
- เอกสารอยู่ใน Supabase Storage แบบ Private
- `/admin` ดูรายการผู้สมัครและเอกสารด้วย Signed URL อายุ 10 นาที
- AI แสดงเฉพาะหน้า Admin
- AI ได้รับเฉพาะชื่อและข้อความความถนัด ไม่ได้รับรูปเอกสาร
- Admin เป็นผู้ตัดสินใจชื่อบริษัทและอีเมลเอง

## เริ่มใช้งาน
1. สร้าง Supabase project
2. เปิด SQL Editor แล้วรัน `supabase.sql`
3. คัดลอก `.env.example` เป็น `.env.local`
4. ใส่ Supabase URL, anon key, service role key, OpenAI API key และ Admin email/password
5. รัน `npm install` แล้ว `npm run dev`
6. เปิด http://localhost:3000/apply
7. Admin: http://localhost:3000/admin

## ก่อนขึ้น Production
- เปลี่ยน Admin auth แบบ env password เป็น Supabase Auth/MFA
- เพิ่ม CAPTCHA / rate limit
- กำหนดนโยบายเก็บและลบเอกสารส่วนบุคคล
- ทำ Privacy Notice / Consent ให้เหมาะกับ PDPA
- ใช้ HTTPS เท่านั้น
- อย่า commit `.env.local` ขึ้น Git
