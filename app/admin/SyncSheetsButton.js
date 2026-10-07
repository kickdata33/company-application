"use client";
import { useState } from "react";

export default function SyncSheetsButton(){
  const [busy,setBusy]=useState(false);
  const [msg,setMsg]=useState("");

  async function sync(){
    setBusy(true);
    setMsg("");
    try{
      const r=await fetch("/api/admin/sync-google-sheets",{method:"POST"});
      const j=await r.json().catch(()=>({}));
      if(!r.ok) throw new Error(j.error || `Sync ไม่สำเร็จ (HTTP ${r.status})`);
      setMsg(`Sync สำเร็จ ${j.rows || 0} รายการ`);
    }catch(e){
      setMsg(e.message || "Sync ไม่สำเร็จ");
    }finally{
      setBusy(false);
    }
  }

  return <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end"}}>
    <button className="btn" onClick={sync} disabled={busy}>
      {busy?"กำลัง Sync...":"Sync to Google Sheets"}
    </button>
    {msg && <span style={{fontSize:13,color:msg.includes("สำเร็จ")?"#176b37":"#a21c1c"}}>{msg}</span>}
  </div>
}
