import { NextResponse } from "next/server";
import { isAdmin } from "../../../../../../lib/adminAuth";
import { supabaseAdmin } from "../../../../../../lib/supabaseAdmin";

export const runtime="nodejs";

export async function GET(req,{params}){
  if(!(await isAdmin())){
    return NextResponse.redirect(new URL("/admin/login",req.url));
  }

  const {id}=await params;
  const type=new URL(req.url).searchParams.get("type");

  const fieldMap={
    front:"id_front",
    back:"id_back",
    house:"house_registration"
  };

  const field=fieldMap[type];
  if(!field){
    return NextResponse.json({error:"Invalid document type"},{status:400});
  }

  const sb=supabaseAdmin();
  const {data,error}=await sb
    .from("applications")
    .select(field)
    .eq("id",id)
    .single();

  if(error || !data?.[field]){
    return NextResponse.json({error:"Document not found"},{status:404});
  }

  const {data:signed,error:signError}=await sb.storage
    .from("application-documents")
    .createSignedUrl(data[field],120);

  if(signError || !signed?.signedUrl){
    return NextResponse.json({error:"Cannot open document"},{status:500});
  }

  return NextResponse.redirect(signed.signedUrl);
}
