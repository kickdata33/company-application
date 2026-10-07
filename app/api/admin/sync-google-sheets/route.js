import { NextResponse } from "next/server";
import { google } from "googleapis";
import { isAdmin } from "../../../../lib/adminAuth";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

export const runtime="nodejs";
export const maxDuration=60;

const DEFAULT_SHEET_ID="1jGM1HTErQOvEhXHWgHhOrCLE__DJ14p0hgEKeyv3vvw";

export async function POST(){
  try{
    if(!(await isAdmin())){
      return NextResponse.json({error:"Unauthorized"},{status:401});
    }

    const email=process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const rawKey=process.env.GOOGLE_PRIVATE_KEY;
    const spreadsheetId=process.env.GOOGLE_SHEET_ID || DEFAULT_SHEET_ID;

    if(!email || !rawKey){
      return NextResponse.json(
        {error:"ยังไม่ได้ตั้งค่า GOOGLE_SERVICE_ACCOUNT_EMAIL และ GOOGLE_PRIVATE_KEY ใน Vercel"},
        {status:500}
      );
    }

    const privateKey=rawKey.replace(/\\n/g,"\n");

    const auth=new google.auth.JWT({
      email,
      key:privateKey,
      scopes:["https://www.googleapis.com/auth/spreadsheets"]
    });

    const sheets=google.sheets({version:"v4",auth});
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

    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range:"Applications!A2:N"
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range:"Applications!A1",
      valueInputOption:"RAW",
      requestBody:{values:[headers,...rows]}
    });

    return NextResponse.json({ok:true,rows:rows.length});
  }catch(e){
    console.error("Google Sheets sync error:",e);
    let message=e?.message || "Sync Google Sheets ไม่สำเร็จ";

    if(String(message).includes("PERMISSION_DENIED") || String(message).includes("403")){
      message="Google Service Account ยังไม่มีสิทธิ์แก้ไข Google Sheet นี้ กรุณา Share Sheet ให้ service account เป็น Editor";
    }

    return NextResponse.json({error:message},{status:500});
  }
}
