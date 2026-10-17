import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getGoogleOAuthClient, sheetIdFromUrl, decryptSecret } from "@/lib/google";
import { google } from "googleapis";

async function authForUser(userId:string) {
 const admin=createAdminClient();
 const {data:connection,error}=await admin.from("google_connections").select("refresh_token").eq("user_id",userId).single();
 if(error||!connection) throw new Error("Hubungkan Google terlebih dahulu.");
 const oauth=getGoogleOAuthClient(); oauth.setCredentials({refresh_token:decryptSecret(connection.refresh_token)});
 return google.sheets({version:"v4",auth:oauth});
}
export async function POST(request:Request) {
 try {
  const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user)return NextResponse.json({error:"Tidak terautentikasi."},{status:401});
  const {url}=await request.json(); const id=sheetIdFromUrl(String(url||""));
  const api=await authForUser(user.id); const result=await api.spreadsheets.get({spreadsheetId:id,fields:"spreadsheetId,properties.title,sheets.properties"});
  const sheets=(result.data.sheets||[]).map(s=>({title:s.properties?.title||"Sheet",sheetId:String(s.properties?.sheetId??"")}));
  return NextResponse.json({title:result.data.properties?.title,sheets});
 } catch(e:any) { return NextResponse.json({error:e.message||"Tidak dapat membaca spreadsheet."},{status:400}); }
}