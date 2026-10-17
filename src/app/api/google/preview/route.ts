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
export async function POST(request:Request) {
 try {
  const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user)return NextResponse.json({error:"Tidak terautentikasi."},{status:401});
  const {url,sheetTitle,headerRow}=await request.json(); const id=sheetIdFromUrl(String(url||"")); const row=Math.max(1,Number(headerRow)||1);
  const api=await apiFor(user.id); const result=await api.spreadsheets.values.get({spreadsheetId:id,range:`'${String(sheetTitle).replace(/'/g,"''")}'!A${row}:Z${row+8}`});
  const values=result.data.values||[]; if(!values.length)return NextResponse.json({error:"Tidak ada data pada baris yang dipilih."},{status:400});
  const headers=values[0].map((h:any)=>String(h||"").trim()); const rows=values.slice(1).filter(r=>r.some((v:any)=>String(v||"").trim())).slice(0,8).map(r=>Object.fromEntries(headers.map((h:string,i:number)=>[h,r[i]??""])));
  return NextResponse.json({headers,rows});
 } catch(e:any) { return NextResponse.json({error:e.message||"Pratinjau gagal."},{status:400}); }
}