import { redirect } from "next/navigation";
import { isAdmin } from "../../lib/adminAuth";
import { supabaseAdmin } from "../../lib/supabaseAdmin";
import SyncSheetsButton from "./SyncSheetsButton";

const SHEET_URL="https://docs.google.com/spreadsheets/d/1jGM1HTErQOvEhXHWgHhOrCLE__DJ14p0hgEKeyv3vvw/edit";

export default async function Admin(){
  if(!(await isAdmin())) redirect("/admin/login");

  const {data=[]}=await supabaseAdmin()
    .from("applications")
    .select("id,created_at,first_name_th,last_name_th,status,selected_company_name,selected_email")
    .order("created_at",{ascending:false});

  return <main className="wrap">
    <div className="card">
      <div className="top">
        <div>
          <h1>ใบสมัครเปิดบริษัท</h1>
          <div className="muted">สำหรับผู้ดูแลระบบ</div>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"flex-end"}}>
          <SyncSheetsButton />
          <a className="btn secondary" style={{whiteSpace:"nowrap"}} href={SHEET_URL} target="_blank" rel="noreferrer">
            เปิด Google Sheets
          </a>
        </div>
      </div>

      <div style={{overflowX:"auto"}}>
        <table>
          <thead>
            <tr>
              <th>ผู้สมัคร</th>
              <th>ชื่อบริษัทที่เลือก</th>
              <th>อีเมลที่เลือก</th>
              <th>วันที่</th>
              <th>สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {data.map(x=>
              <tr key={x.id}>
                <td><a href={`/admin/${x.id}`}>{x.first_name_th} {x.last_name_th}</a></td>
                <td>{x.selected_company_name || "-"}</td>
                <td>{x.selected_email || "-"}</td>
                <td>{new Date(x.created_at).toLocaleString("th-TH")}</td>
                <td><span className="pill">{x.status}</span></td>
              </tr>
            )}
            {!data.length&&<tr><td colSpan="5">ยังไม่มีใบสมัคร</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  </main>
}
