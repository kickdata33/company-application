import { NextResponse } from "next/server";
import { isAdmin } from "../../../../lib/adminAuth";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

export const runtime="nodejs";
export const maxDuration=60;

export async function POST(){
  try{
    if(!(await isAdmin())){
      return NextResponse.json({error:"Unauthorized"},{status:401});
    }

    const scriptUrl=process.env.GOOGLE_APPS_SCRIPT_URL;
    const syncSecret=(process.env.GOOGLE_SYNC_SECRET || "").trim();

    if(!scriptUrl || !syncSecret){
      return NextResponse.json(
        {error:"ยังไม่ได้ตั้งค่า GOOGLE_APPS_SCRIPT_URL และ GOOGLE_SYNC_SECRET ใน Vercel"},
        {status:500}
      );
    }

    const sb=supabaseAdmin();
    const {data,error}=await sb
      .from("applications")
      .select("*")
      .order("created_at",{ascending:true});

    if(error) throw error;

    const headers=[
      "Application ID","วันที่สมัคร","ชื่อ ภาษาไทย","นามสกุล ภาษาไทย",
      "First Name","Last Name","สิ่งที่ถนัด/มีความรู้","ผลวิเคราะห์ AI",
      "ชื่อบริษัทที่เลือก","อีเมลที่เลือก","สถานะ",
      "ไฟล์บัตรประชาชนด้านหน้า","ไฟล์บัตรประชาชนด้านหลัง","ไฟล์ทะเบียนบ้าน"
    ];

    const rows=(data || []).map(x=>[
      x.id || "",
      x.created_at ? new Date(x.created_at).toLocaleString("th-TH",{timeZone:"Asia/Bangkok"}) : "",
      x.first_name_th || "",
      x.last_name_th || "",
      x.first_name_en || "",
      x.last_name_en || "",
      x.skills || "",
      x.ai_analysis || "",
      x.selected_company_name || "",
      x.selected_email || "",
      x.status || "",
      x.id_front || "",
      x.id_back || "",
      x.house_registration || ""
    ]);

    const r=await fetch(scriptUrl,{
      method:"POST",
      headers:{"content-type":"application/json"},
      body:JSON.stringify({
        secret:syncSecret,
        headers,
        rows
      }),
      redirect:"follow"
    });

    const text=await r.text();
    let result={};
    try{ result=JSON.parse(text); }catch{}

    if(!r.ok || result.ok!==true){
      if(result.error==="Unauthorized"){
        throw new Error("SYNC_SECRET ไม่ตรงกันระหว่าง Vercel กับ Google Apps Script");
      }
      throw new Error(result.error || `Google Apps Script sync failed (HTTP ${r.status})`);
    }

    return NextResponse.json({ok:true,rows:rows.length});
  }catch(e){
    console.error("Google Sheets sync error:",e);
    return NextResponse.json(
      {error:e?.message || "Sync Google Sheets ไม่สำเร็จ"},
      {status:500}
    );
  }
}
