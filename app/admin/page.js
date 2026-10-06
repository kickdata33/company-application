import { redirect } from "next/navigation";
import { isAdmin } from "../../lib/adminAuth";
import { supabaseAdmin } from "../../lib/supabaseAdmin";

export default async function Admin(){
 if(!(await isAdmin())) redirect("/admin/login");
 const {data=[]}=await supabaseAdmin().from("applications").select("id,created_at,first_name_th,last_name_th,status").order("created_at",{ascending:false});
 return <main className="wrap"><div className="card"><div className="top"><div><h1>ใบสมัครเปิดบริษัท</h1><div className="muted">สำหรับผู้ดูแลระบบ</div></div></div>
 <table><thead><tr><th>ผู้สมัคร</th><th>วันที่</th><th>สถานะ</th></tr></thead><tbody>
 {data.map(x=><tr key={x.id}><td><a href={`/admin/${x.id}`}>{x.first_name_th} {x.last_name_th}</a></td><td>{new Date(x.created_at).toLocaleString("th-TH")}</td><td><span className="pill">{x.status}</span></td></tr>)}
 {!data.length&&<tr><td colSpan="3">ยังไม่มีใบสมัคร</td></tr>}
 </tbody></table></div></main>
}
