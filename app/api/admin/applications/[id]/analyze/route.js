import { NextResponse } from "next/server";
import OpenAI from "openai";
import { isAdmin } from "../../../../../../lib/adminAuth";
import { supabaseAdmin } from "../../../../../../lib/supabaseAdmin";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req,{params}){
  try {
    if(!(await isAdmin())) {
      return NextResponse.json({error:"Unauthorized"},{status:401});
    }

    if(!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {error:"ยังไม่ได้ตั้งค่า OPENAI_API_KEY ใน .env.local"},
        {status:500}
      );
    }

    const {id}=await params;
    const sb=supabaseAdmin();

    const {data:a,error:dbError}=await sb
      .from("applications")
      .select("first_name_th,last_name_th,first_name_en,last_name_en,skills")
      .eq("id",id)
      .single();

    if(dbError || !a) {
      return NextResponse.json({error:"ไม่พบข้อมูลผู้สมัคร"},{status:404});
    }

    const client=new OpenAI({
      apiKey:process.env.OPENAI_API_KEY,
      timeout:30000,
      maxRetries:1
    });

    const prompt=`คุณเป็นผู้ช่วยหลังบ้านสำหรับวิเคราะห์แนวทางตั้งชื่อบริษัทในประเทศไทย

ข้อมูลผู้สมัคร:
ชื่อไทย: ${a.first_name_th} ${a.last_name_th}
ชื่ออังกฤษ: ${a.first_name_en} ${a.last_name_en}
ความถนัด/ความรู้: ${a.skills}

วิเคราะห์จาก "ความถนัด/ความรู้" เป็นหลัก ห้ามอ้างว่าชื่อบริษัทว่างหรือจดทะเบียนได้แน่นอน

ตอบภาษาไทยแบบกระชับ:
1. ธุรกิจ/ประเภทธุรกิจที่เหมาะสม 3 แนวทาง
2. ชื่อบริษัทภาษาไทย + ภาษาอังกฤษ 5 ชุด
3. ชื่ออีเมล Gmail ที่เหมาะสม 5 ชื่อ
4. ชื่อโดเมนที่เหมาะสม 3 ชื่อ
5. หมายเหตุสั้น ๆ ว่า Admin ต้องตรวจชื่อกับหน่วยงานจดทะเบียนก่อนใช้จริง`;

    const res=await client.responses.create({
      model:"gpt-5-mini",
      input:prompt
    });

    const analysis=(res.output_text || "").trim();
    if(!analysis) {
      return NextResponse.json(
        {error:"AI ตอบกลับมาแต่ไม่มีข้อความ กรุณาลองใหม่"},
        {status:502}
      );
    }

    const {error:updateError}=await sb
      .from("applications")
      .update({ai_analysis:analysis,status:"analyzed"})
      .eq("id",id);

    if(updateError) {
      return NextResponse.json(
        {error:"AI วิเคราะห์สำเร็จ แต่บันทึกผลลงฐานข้อมูลไม่สำเร็จ"},
        {status:500}
      );
    }

    return NextResponse.json({analysis});
  } catch (e) {
    console.error("OpenAI analyze error:", e);

    let message="วิเคราะห์ด้วย AI ไม่สำเร็จ";
    if(e?.status===401) message="OpenAI API Key ไม่ถูกต้อง";
    else if(e?.status===429) message="OpenAI API ใช้งานไม่ได้ชั่วคราว: กรุณาตรวจ Billing / Credit / Quota";
    else if(e?.status===403) message="OpenAI API Key ไม่มีสิทธิ์ใช้โมเดลนี้";
    else if(e?.code==="ETIMEDOUT" || e?.name==="APIConnectionTimeoutError") message="OpenAI ตอบกลับช้าเกิน 30 วินาที กรุณาลองใหม่";
    else if(e?.message) message=e.message;

    return NextResponse.json({error:message},{status:e?.status || 500});
  }
}
