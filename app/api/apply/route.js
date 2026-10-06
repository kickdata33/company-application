import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import crypto from "crypto";

export const runtime = "nodejs";

const allowed = ["image/jpeg","image/png","application/pdf"];
const maxBytes = 8 * 1024 * 1024;

async function upload(supabase, file, folder, label){
  if(!file || file.size === 0) throw new Error(`กรุณาแนบ ${label}`);
  if(!allowed.includes(file.type)) throw new Error(`${label}: รองรับเฉพาะ JPG, PNG, PDF`);
  if(file.size > maxBytes) throw new Error(`${label}: ไฟล์ต้องไม่เกิน 8 MB`);
  const ext=(file.name.split(".").pop() || "bin").toLowerCase();
  const path=`${folder}/${crypto.randomUUID()}.${ext}`;
  const buf=Buffer.from(await file.arrayBuffer());
  const {error}=await supabase.storage.from("application-documents").upload(path,buf,{contentType:file.type,upsert:false});
  if(error) throw error;
  return path;
}

export async function POST(req){
  try{
    const fd=await req.formData();
    const fields=["first_name_th","last_name_th","first_name_en","last_name_en","skills"];
    for(const x of fields) if(!String(fd.get(x)||"").trim()) throw new Error("กรุณากรอกข้อมูลให้ครบ");
    const supabase=supabaseAdmin();
    const folder=crypto.randomUUID();
    const id_front=await upload(supabase,fd.get("id_front"),folder,"บัตรประชาชนด้านหน้า");
    const id_back=await upload(supabase,fd.get("id_back"),folder,"บัตรประชาชนด้านหลัง");
    const house_registration=await upload(supabase,fd.get("house_registration"),folder,"ทะเบียนบ้าน");
    const payload={
      first_name_th:String(fd.get("first_name_th")).trim(),
      last_name_th:String(fd.get("last_name_th")).trim(),
      first_name_en:String(fd.get("first_name_en")).trim(),
      last_name_en:String(fd.get("last_name_en")).trim(),
      skills:String(fd.get("skills")).trim(),
      id_front,id_back,house_registration,status:"new"
    };
    const {error}=await supabase.from("applications").insert(payload);
    if(error) throw error;
    return NextResponse.json({ok:true});
  }catch(e){ return NextResponse.json({error:e.message},{status:400}); }
}
