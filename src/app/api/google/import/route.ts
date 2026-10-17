import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getGoogleOAuthClient, sheetIdFromUrl, decryptSecret } from "@/lib/google";
import { google } from "googleapis";

async function apiFor(userId:string) {
 const admin=createAdminClient(); const {data:c}=await admin.from("google_connections").select("refresh_token").eq("user_id",userId).single();
 if(!c) throw new Error("Hubungkan Google terlebih dahulu.");
 const auth=getGoogleOAuthClient(); auth.setCredentials({refresh_token:decryptSecret(c.refresh_token)}); return google.sheets({version:"v4",auth});
}
const norm=(s:any)=>String(s??"").trim().toLowerCase().replace(/\s+/g," ");
function find(row:Record<string,any>,...keys:string[]) { const entry=Object.entries(row).find(([k])=>keys.includes(norm(k))); return entry?.[1]??""; }
function checked(v:any) { return ["✓","✔","yes","true","done","1","v","check"].includes(norm(v)); }
function parseFee(v:any) { const n=Number(String(v??"").replace(/[^\d-]/g,"")); return Number.isFinite(n)?Math.max(0,n):0; }
function parseDate(v:any) {
 const s=String(v??"").trim(); if(!s)return null;
 const iso=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/); if(iso)return `${iso[1]}-${iso[2].padStart(2,"0")}-${iso[3].padStart(2,"0")}`;
 const months:Record<string,string>={januari:"01",jan:"01",februari:"02",feb:"02",maret:"03",mar:"03",april:"04",apr:"04",mei:"05",juni:"06",jun:"06",juli:"07",jul:"07",agustus:"08",agu:"08",september:"09",sep:"09",oktober:"10",okt:"10",november:"11",nov:"11",desember:"12",des:"12"};
 const m=s.toLowerCase().match(/^(\d{1,2})\s+([a-z]+)(?:\s+(\d{4}))?$/);
 if(m&&months[m[2]]&&m[3])return `${m[3]}-${months[m[2]]}-${m[1].padStart(2,"0")}`;
 return null;
}
function mapStage(row:Record<string,any>) {
 const done=find(row,"done","done all"); if(checked(done))return "done";
 const post=find(row,"tanggal posting","posting date"); if(checked(post)||parseDate(post))return "posted";
 const draft=find(row,"draft"); if(checked(draft))return "submit_draft";
 return "invitation";
}
function mapPayment(row:Record<string,any>) {
 const raw=norm(find(row,"pembayaran (unpaid/paid)","pembayaran","payment status","pembayaran status"));
 if(raw.includes("barter"))return "barter"; if(raw.includes("paid")||raw==="lunas")return "paid"; if(raw.includes("partial")||raw.includes("parsial"))return "partial"; return "unpaid";
}
export async function POST(request:Request) {
 try {
  const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user)return NextResponse.json({error:"Tidak terautentikasi."},{status:401});
  const {data:profile}=await supabase.from("profiles").select("workspace_id").eq("id",user.id).single(); if(!profile?.workspace_id)return NextResponse.json({error:"Akun belum memiliki workspace."},{status:400});
  const {url,sheetTitle,headerRow}=await request.json(); const id=sheetIdFromUrl(String(url||"")); const rowNum=Math.max(1,Number(headerRow)||1);
  const api=await apiFor(user.id); const result=await api.spreadsheets.values.get({spreadsheetId:id,range:`'${String(sheetTitle).replace(/'/g,"''")}'!A${rowNum}:Z`});
  const values=result.data.values||[]; if(!values.length)return NextResponse.json({error:"Spreadsheet kosong."},{status:400});
  const headers=values[0].map((h:any)=>String(h||"").trim()); const sourceRows=values.slice(1).filter(r=>r.some((v:any)=>String(v||"").trim()));
  const rows=sourceRows.map(r=>Object.fromEntries(headers.map((h:string,i:number)=>[h,r[i]??""]))).filter(r=>String(find(r,"nama brand","brand","brand name")||"").trim());
  const names=rows.map(r=>String(find(r,"nama brand","brand","brand name")).trim());
  const {data:existing}=await supabase.from("endorsements").select("brand_name").eq("workspace_id",profile.workspace_id).in("brand_name",names);
  const existingNames=new Set((existing||[]).map(j=>norm(j.brand_name)));
  const toInsert:any[]=[]; let skipped=0;
  for(const r of rows) {
   const brand=String(find(r,"nama brand","brand","brand name")).trim();
   if(existingNames.has(norm(brand))){skipped++;continue;}
   const rawPlatform=String(find(r,"platform (ig/tiktok/shopee, dll)","platform","platforms")||"Lainnya");
   const platform=rawPlatform.split(/[,/&]+/).map(s=>s.trim()).filter(Boolean);
   const payment=mapPayment(r);
   const fee=parseFee(find(r,"fee (rp)","fee","fee (idr)","fee idr"));
   const stage=mapStage(r);
   const postRaw=find(r,"tanggal posting","posting date");
   const posting=parseDate(postRaw);
   toInsert.push({workspace_id:profile.workspace_id,brand_name:brand,brand_handle:String(find(r,"handle brand","handle","brand handle")||"").trim()||null,platform,fee_idr:fee,stage,posting_date:posting,payment_status:payment,notes:`Diimpor dari Google Sheets: ${String(find(r,"no","nomor")||"")}${postRaw?` · Tanggal posting sumber: ${String(postRaw)}`:""}`});
   existingNames.add(norm(brand));
  }
  let imported=0;
  for(let i=0;i<toInsert.length;i+=100) {
   const {error}=await supabase.from("endorsements").insert(toInsert.slice(i,i+100));
   if(error)throw error; imported+=toInsert.slice(i,i+100).length;
  }
  return NextResponse.json({imported,skipped:skipped+(rows.length-toInsert.length-skipped)});
 } catch(e:any) { return NextResponse.json({error:e.message||"Impor gagal."},{status:400}); }
}