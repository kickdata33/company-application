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

    const prompt=`คุณทำหน้าที่เป็น "Business Architect + Brand Strategist" สำหรับช่วย Admin วิเคราะห์ผู้สมัครเพื่อวางแนวทางเปิดบริษัทในประเทศไทย

ข้อมูลผู้สมัคร:
ชื่อไทย: ${a.first_name_th} ${a.last_name_th}
ชื่ออังกฤษ: ${a.first_name_en} ${a.last_name_en}
สิ่งที่ถนัด/มีความรู้: ${a.skills}

กติกาสำคัญ:
- ห้ามนำชื่อจริง นามสกุล ชื่อเล่น หรือคำถอดเสียงชื่อของผู้สมัครไปใช้เป็นชื่อบริษัท เว้นแต่ข้อมูลความถนัดระบุว่าเป็น Personal Brand โดยตรง
- ชื่อบริษัทต้อง "สื่อถึงธุรกิจ/แนวคิด/คุณค่า" และควรรองรับการขยายกิจการในอนาคต
- อย่าคิดแค่ธุรกิจตรงตัวจากคำตอบ ต้องแตกแขนงไปยังธุรกิจที่เกี่ยวข้องและสามารถใช้ความรู้เดิมร่วมกันได้
- ห้ามแต่งประสบการณ์ รายได้ เงินทุน หรือความสามารถที่ผู้สมัครไม่ได้ระบุ
- ห้ามอ้างว่าชื่อบริษัท โดเมน หรืออีเมลว่างจริง ต้องระบุว่าเป็นเพียงแนวทางและต้องตรวจสอบก่อนใช้
- หลีกเลี่ยงชื่อสามัญเกินไป เช่น "IT Solution", "Digital", "Technology" แบบตรง ๆ หากไม่มีแนวคิดแบรนด์รองรับ
- ชื่อที่เสนอควรมีทั้งแนว Corporate, Brandable และ Umbrella/Holding เพื่อให้ Admin เลือกตามภาพธุรกิจ

วิเคราะห์ให้ลึกและตอบภาษาไทยตามโครงสร้างนี้:

1. **แกนความสามารถที่ AI มองเห็น**
สรุป 3-5 ข้อว่าจากข้อมูลนี้ ผู้สมัครมีความสามารถหรือความสนใจอะไรที่สามารถนำไปสร้างรายได้ได้ โดยอิงเฉพาะข้อมูลที่ให้มา

2. **แผนที่ธุรกิจที่ต่อยอดได้**
แบ่งเป็น:
- ธุรกิจหลัก (Core) 3-5 แนวทาง
- ธุรกิจที่เกี่ยวข้อง/ต่อยอด (Adjacent) 5-8 แนวทาง
- ธุรกิจที่สามารถขยายในอนาคต (Expansion) 3-5 แนวทาง

แต่ละแนวทางให้บอกสั้น ๆ:
- ทำอะไร
- ลูกค้าหลักเป็นใคร
- หาเงินจากอะไร
- เหตุผลว่าทำไมจึงเชื่อมกับความถนัดเดิม

3. **โมเดลบริษัทที่แนะนำ**
เสนอ 3 โมเดล เช่น
- บริษัทโฟกัสธุรกิจเดียว
- บริษัทที่รวมหลายบริการที่เกี่ยวข้อง
- บริษัทแม่/แบรนด์กลางที่รองรับหลายธุรกิจ
พร้อมข้อดี-ข้อควรระวังแบบสั้น

4. **แนวคิดการตั้งชื่อบริษัท**
สร้าง "แกนชื่อ" 4-6 แนวคิด เช่น ความเร็ว ความน่าเชื่อถือ การเชื่อมต่อ โครงสร้างพื้นฐาน ความสะดวก นวัตกรรม การดูแลครบวงจร ฯลฯ
อธิบายสั้น ๆ ว่าแต่ละแนวคิดเหมาะกับภาพบริษัทแบบไหน

5. **ชื่อบริษัทที่แนะนำ**
เสนอ 12 ชื่อ แบ่งเป็น:
- Corporate 4 ชื่อ
- Brandable 4 ชื่อ
- Umbrella / รองรับหลายธุรกิจ 4 ชื่อ

แต่ละชื่อให้มี:
- ชื่อภาษาไทย
- ชื่อภาษาอังกฤษ
- ความหมาย/แนวคิด 1 บรรทัด
- เหตุผลว่ารองรับธุรกิจใดได้บ้าง

ห้ามใช้ชื่อ/นามสกุลของผู้สมัครในชื่อทั้งหมด

6. **ชื่อแบรนด์สั้น**
เสนอชื่อสั้น 8-10 ชื่อ สำหรับใช้หน้าร้าน เว็บไซต์ แอป หรือเพจ
ต้องจำง่าย ออกเสียงง่าย และไม่ผูกกับชื่อบุคคล

7. **อีเมลที่แนะนำ**
เสนอรูปแบบอีเมลจาก "ชื่อแบรนด์/ชื่อบริษัท" ที่แนะนำเท่านั้น เช่น:
hello@...
contact@...
support@...
admin@...
accounting@...
ห้ามใช้อีเมลที่อิงชื่อบุคคล

8. **โดเมนที่ควรลองตรวจสอบ**
เสนอ 6-8 ชื่อโดเมนที่สัมพันธ์กับชื่อแบรนด์/บริษัท โดยใช้คำสั้นและจำง่าย
ระบุชัดเจนว่า "ยังไม่ได้ตรวจสอบว่าว่างหรือไม่"

9. **ข้อสรุปสำหรับ Admin**
เลือก 3 ทางเลือกที่ดีที่สุดจากทั้งหมด พร้อมบอก:
- เหมาะกับใคร
- จุดแข็ง
- ข้อจำกัด
- ถ้าจะให้เติบโตระยะยาว AI เลือกทางไหนเป็นอันดับ 1 และเพราะอะไร

เป้าหมายของคำตอบคือให้ Admin อ่านแล้วสามารถใช้ตัดสินใจ "วางโครงบริษัทจริง" ได้ ไม่ใช่แค่ได้รายชื่อบริษัทแบบทั่วไป`;

    const res=await client.responses.create({
      model:"gpt-6-luna",
      input:prompt,
      max_output_tokens:2600
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
    else if(e?.status===404) message="ไม่พบโมเดล AI ที่ตั้งค่าไว้ หรือ API Project นี้ไม่มีสิทธิ์ใช้โมเดล";
    else if(e?.status===429) message="OpenAI API ใช้งานไม่ได้ชั่วคราว: กรุณาตรวจ Billing / Credit / Quota";
    else if(e?.status===403) message="OpenAI API Key ไม่มีสิทธิ์ใช้โมเดลนี้";
    else if(e?.code==="ETIMEDOUT" || e?.name==="APIConnectionTimeoutError") message="OpenAI ตอบกลับช้าเกิน 30 วินาที กรุณาลองใหม่";
    else if(e?.message) message=e.message;

    return NextResponse.json({error:message},{status:e?.status || 500});
  }
}
