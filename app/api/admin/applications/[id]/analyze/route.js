import { NextResponse } from "next/server";
import OpenAI from "openai";
import { isAdmin } from "../../../../../../lib/adminAuth";
import { supabaseAdmin } from "../../../../../../lib/supabaseAdmin";

export async function POST(req,{params}){
 if(!(await isAdmin())) return NextResponse.json({error:"Unauthorized"},{status:401});
 const {id}=await params; const sb=supabaseAdmin();
 const {data:a}=await sb.from("applications").select("first_name_th,last_name_th,first_name_en,last_name_en,skills").eq("id",id).single();
 if(!a) return NextResponse.json({error:"Not found"},{status:404});
 const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
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
 const res=await client.responses.create({model:"gpt-5-mini",input:prompt});
 const analysis=res.output_text;
 await sb.from("applications").update({ai_analysis:analysis,status:"analyzed"}).eq("id",id);
 return NextResponse.json({analysis});
}
