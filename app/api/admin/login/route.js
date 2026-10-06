import { NextResponse } from "next/server";
import { setAdminCookie } from "../../../../lib/adminAuth";
export async function POST(req){
 const fd=await req.formData();
 if(fd.get("email")!==process.env.ADMIN_EMAIL || fd.get("password")!==process.env.ADMIN_PASSWORD) return NextResponse.json({error:"Unauthorized"},{status:401});
 await setAdminCookie(); return NextResponse.json({ok:true});
}
