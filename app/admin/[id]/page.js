import { redirect, notFound } from "next/navigation";
import { isAdmin } from "../../../lib/adminAuth";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import AdminActions from "./AdminActions";

export default async function Detail({params}){
 if(!(await isAdmin())) redirect("/admin/login");
 const {id}=await params; const sb=supabaseAdmin();
 const {data:a}=await sb.from("applications").select("*").eq("id",id).single();
 if(!a) notFound();
 async function signed(path){const {data}=await sb.storage.from("application-documents").createSignedUrl(path,600);return data?.signedUrl}
 const docs={front:await signed(a.id_front),back:await signed(a.id_back),house:await signed(a.house_registration)};
 return <main className="wrap"><div className="card">
 <div className="top"><h1>{a.first_name_th} {a.last_name_th}</h1><a href="/admin">← กลับ</a></div>
 <p><b>ชื่ออังกฤษ:</b> {a.first_name_en} {a.last_name_en}</p>
 <p><b>สิ่งที่ถนัด/มีความรู้:</b></p><div className="ai">{a.skills}</div>
 <h2>เอกสาร</h2><div className="docs"><a href={docs.front} target="_blank">เปิดบัตรประชาชนด้านหน้า</a><a href={docs.back} target="_blank">เปิดบัตรประชาชนด้านหลัง</a><a href={docs.house} target="_blank">เปิดทะเบียนบ้าน</a></div>
 <h2 style={{marginTop:28}}>AI สำหรับ Admin</h2>
 <AdminActions id={a.id} initial={a.ai_analysis||""} selectedName={a.selected_company_name||""} selectedEmail={a.selected_email||""}/>
 </div></main>
}
