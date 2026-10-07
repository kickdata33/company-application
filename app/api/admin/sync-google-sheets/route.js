import { NextResponse } from "next/server";
import sharp from "sharp";
import { isAdmin } from "../../../../lib/adminAuth";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

export const runtime="nodejs";
export const maxDuration=60;

function extFromPath(path=""){
  const clean=String(path).split("?")[0];
  const ext=clean.includes(".") ? clean.split(".").pop().toLowerCase() : "bin";
  return ext || "bin";
}

function mimeFromPath(path=""){
  const ext=extFromPath(path);
  if(ext==="jpg" || ext==="jpeg") return "image/jpeg";
  if(ext==="png") return "image/png";
  if(ext==="webp") return "image/webp";
  if(ext==="gif") return "image/gif";
  if(ext==="pdf") return "application/pdf";
  return "application/octet-stream";
}

async function makeThumbnail(url,mimeType){
  if(!mimeType.startsWith("image/")) return null;

  try{
    const r=await fetch(url,{cache:"no-store"});
    if(!r.ok) return null;

    const input=Buffer.from(await r.arrayBuffer());
    const output=await sharp(input)
      .rotate()
      .resize({
        width:320,
        height:220,
        fit:"inside",
        withoutEnlargement:true
      })
      .jpeg({quality:72})
      .toBuffer();

    return {
      mimeType:"image/jpeg",
      base64:output.toString("base64")
    };
  }catch(e){
    console.error("Thumbnail error:",e);
    return null;
  }
}

async function signedDocument(sb,path,fileName){
  if(!path) return null;

  const {data,error}=await sb.storage
    .from("application-documents")
    .createSignedUrl(path,600);

  if(error || !data?.signedUrl) return null;

  const mimeType=mimeFromPath(path);
  const thumbnail=await makeThumbnail(data.signedUrl,mimeType);

  return {
    url:data.signedUrl,
    fileName,
    mimeType,
    thumbnail
  };
}

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
      "บัตรประชาชนด้านหน้า","บัตรประชาชนด้านหลัง","ทะเบียนบ้าน"
    ];

    const records=[];

    for(const x of (data || [])){
      const frontExt=extFromPath(x.id_front);
      const backExt=extFromPath(x.id_back);
      const houseExt=extFromPath(x.house_registration);

      const [front,back,house]=await Promise.all([
        signedDocument(sb,x.id_front,`${x.id}-id-front.${frontExt}`),
        signedDocument(sb,x.id_back,`${x.id}-id-back.${backExt}`),
        signedDocument(sb,x.house_registration,`${x.id}-house-registration.${houseExt}`)
      ]);

      records.push({
        values:[
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
          "",
          "",
          ""
        ],
        documents:{front,back,house}
      });
    }

    const r=await fetch(scriptUrl,{
      method:"POST",
      headers:{"content-type":"application/json"},
      body:JSON.stringify({
        secret:syncSecret,
        headers,
        records
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

    return NextResponse.json({
      ok:true,
      rows:records.length,
      driveFolderUrl:result.driveFolderUrl || null
    });
  }catch(e){
    console.error("Google Sheets sync error:",e);
    return NextResponse.json(
      {error:e?.message || "Sync Google Sheets ไม่สำเร็จ"},
      {status:500}
    );
  }
}
