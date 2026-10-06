"use client";
import { useState } from "react";

export default function ApplyPage(){
  const [msg,setMsg]=useState("");
  const [busy,setBusy]=useState(false);

  async function submit(e){
    e.preventDefault(); setBusy(true); setMsg("");
    const fd=new FormData(e.currentTarget);
    const r=await fetch("/api/apply",{method:"POST",body:fd});
    const j=await r.json();
    if(r.ok){ setMsg("ส่งข้อมูลเรียบร้อยแล้ว กรุณารอเจ้าหน้าที่ตรวจสอบ"); e.currentTarget.reset(); }
    else setMsg(j.error || "ส่งข้อมูลไม่สำเร็จ");
    setBusy(false);
  }

  return <main className="wrap">
    <div className="card">
      <h1>สมัครเปิดบริษัท</h1>
      <div className="muted">กรอกข้อมูลและแนบเอกสารให้ครบถ้วน</div>
      {msg && <div className={msg.includes("เรียบร้อย")?"notice":"notice error"}>{msg}</div>}
      <form onSubmit={submit}>
        <div className="grid">
          <div className="field"><label>ชื่อ ภาษาไทย</label><input name="first_name_th" required /></div>
          <div className="field"><label>นามสกุล ภาษาไทย</label><input name="last_name_th" required /></div>
          <div className="field"><label>First Name (English)</label><input name="first_name_en" pattern="[A-Za-z .'-]+" required /></div>
          <div className="field"><label>Last Name (English)</label><input name="last_name_en" pattern="[A-Za-z .'-]+" required /></div>
        </div>
        <div className="field"><label>บัตรประชาชนด้านหน้า</label><input type="file" name="id_front" accept=".jpg,.jpeg,.png,.pdf" required /></div>
        <div className="field"><label>บัตรประชาชนด้านหลัง</label><input type="file" name="id_back" accept=".jpg,.jpeg,.png,.pdf" required /></div>
        <div className="field"><label>ทะเบียนบ้าน</label><input type="file" name="house_registration" accept=".jpg,.jpeg,.png,.pdf" required /></div>
        <div className="field"><label>สิ่งที่ถนัดหรือมีความรู้</label><textarea name="skills" placeholder="อธิบายความรู้ ความถนัด หรือประสบการณ์ของคุณ" required /></div>
        <button className="btn" disabled={busy}>{busy?"กำลังส่ง...":"ส่งข้อมูลสมัคร"}</button>
      </form>
    </div>
  </main>
}
