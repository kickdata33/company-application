import { NextResponse } from "next/server";
import { isAdmin } from "../../../../../../lib/adminAuth";
import { supabaseAdmin } from "../../../../../../lib/supabaseAdmin";
export async function POST(req,{params}){
 if(!(await isAdmin())) return NextResponse.json({error:"Unauthorized"},{status:401});
 const {id}=await params; const body=await req.json();
 const {error}=await supabaseAdmin().from("applications").update({
   selected_company_name:String(body.selected_company_name||"").trim(),
   selected_email:String(body.selected_email||"").trim(),
   status:"decided"
 }).eq("id",id);
 if(error)return NextResponse.json({error:error.message},{status:400});
 return NextResponse.json({ok:true});
}
