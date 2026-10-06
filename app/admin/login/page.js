"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export default function Login(){
 const [err,setErr]=useState(""); const router=useRouter();
 async function go(e){e.preventDefault();const fd=new FormData(e.currentTarget);const r=await fetch("/api/admin/login",{method:"POST",body:fd});if(r.ok){router.push("/admin");router.refresh()}else setErr("อีเมลหรือรหัสผ่านไม่ถูกต้อง")}
 return <main className="wrap"><div className="card"><h1>Admin Login</h1>{err&&<div className="notice error">{err}</div>}<form onSubmit={go}><div className="field"><label>อีเมล</label><input name="email" type="email" required/></div><div className="field"><label>รหัสผ่าน</label><input name="password" type="password" required/></div><button className="btn">เข้าสู่ระบบ</button></form></div></main>
}
