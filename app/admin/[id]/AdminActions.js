"use client";
import { useState } from "react";

export default function AdminActions({id,initial,selectedName,selectedEmail}){
  const [ai,setAi]=useState(initial);
  const [busy,setBusy]=useState(false);
  const [name,setName]=useState(selectedName);
  const [email,setEmail]=useState(selectedEmail);
  const [msg,setMsg]=useState("");

  async function analyze(){
    setBusy(true);
    setMsg("");
    try {
      const r=await fetch(`/api/admin/applications/${id}/analyze`,{method:"POST"});
      let j={};
      try { j=await r.json(); } catch {}

      if(r.ok && j.analysis){
        setAi(j.analysis);
        setMsg("วิเคราะห์เรียบร้อยแล้ว");
      }else{
        setMsg(j.error || `วิเคราะห์ไม่สำเร็จ (HTTP ${r.status})`);
      }
    }catch(e){
      setMsg("เชื่อมต่อระบบ AI ไม่สำเร็จ กรุณาลองใหม่");
    }finally{
      setBusy(false);
    }
  }

  async function save(){
    try {
      const r=await fetch(`/api/admin/applications/${id}/decision`,{
        method:"POST",
        headers:{"content-type":"application/json"},
        body:JSON.stringify({selected_company_name:name,selected_email:email})
      });
      setMsg(r.ok?"บันทึกแล้ว":"บันทึกไม่สำเร็จ");
    }catch{
      setMsg("เชื่อมต่อระบบไม่สำเร็จ");
    }
  }

  return <div>
    <button className="btn" onClick={analyze} disabled={busy}>
      {busy?"กำลังวิเคราะห์...":"วิเคราะห์ด้วย AI"}
    </button>

    {msg && <div className={msg.includes("ไม่") || msg.includes("ผิด") || msg.includes("Quota") || msg.includes("Billing") ? "notice error" : "notice"}>{msg}</div>}

    {ai&&<div className="ai" style={{marginTop:16}}>{ai}</div>}

    <h2 style={{marginTop:28}}>Admin ตัดสินใจ</h2>
    <div className="field">
      <label>ชื่อบริษัทที่เลือก</label>
      <input value={name} onChange={e=>setName(e.target.value)} placeholder="Admin กรอกชื่อที่ตัดสินใจใช้"/>
    </div>
    <div className="field">
      <label>อีเมลที่เลือก</label>
      <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Admin กรอกอีเมลที่ตัดสินใจใช้"/>
    </div>
    <button className="btn" onClick={save}>บันทึกผล</button>
  </div>
}
