import { isAdmin } from "../../../../lib/adminAuth";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import * as XLSX from "xlsx";

export const runtime = "nodejs";

export async function GET(){
  if(!(await isAdmin())){
    return new Response("Unauthorized",{status:401});
  }

  const sb=supabaseAdmin();
  const {data,error}=await sb
    .from("applications")
    .select("*")
    .order("created_at",{ascending:false});

  if(error){
    return new Response(error.message,{status:500});
  }

  const rows=(data || []).map((x,index)=>({
    "ลำดับ": index+1,
    "วันที่สมัคร": new Date(x.created_at).toLocaleString("th-TH"),
    "ชื่อ ภาษาไทย": x.first_name_th || "",
    "นามสกุล ภาษาไทย": x.last_name_th || "",
    "First Name": x.first_name_en || "",
    "Last Name": x.last_name_en || "",
    "สิ่งที่ถนัด/มีความรู้": x.skills || "",
    "ผลวิเคราะห์ AI": x.ai_analysis || "",
    "ชื่อบริษัทที่เลือก": x.selected_company_name || "",
    "อีเมลที่เลือก": x.selected_email || "",
    "สถานะ": x.status || "",
    "ไฟล์บัตรประชาชนด้านหน้า": x.id_front || "",
    "ไฟล์บัตรประชาชนด้านหลัง": x.id_back || "",
    "ไฟล์ทะเบียนบ้าน": x.house_registration || "",
    "Application ID": x.id
  }));

  const ws=XLSX.utils.json_to_sheet(rows);

  ws["!cols"]=[
    {wch:7},{wch:20},{wch:20},{wch:24},{wch:18},{wch:22},
    {wch:45},{wch:80},{wch:35},{wch:35},{wch:14},
    {wch:45},{wch:45},{wch:45},{wch:38}
  ];

  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,"Applications");

  const buffer=XLSX.write(wb,{type:"buffer",bookType:"xlsx"});
  const date=new Date().toISOString().slice(0,10);

  return new Response(buffer,{
    status:200,
    headers:{
      "Content-Type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":`attachment; filename="company-applications-${date}.xlsx"`,
      "Cache-Control":"no-store"
    }
  });
}
