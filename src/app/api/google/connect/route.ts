import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGoogleOAuthClient } from "@/lib/google";

export async function GET(request:Request) {
 try {
  const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser();
  if(!user) return NextResponse.json({error:"Silakan masuk terlebih dahulu."},{status:401});
  const oauth=getGoogleOAuthClient();
  const url=oauth.generateAuthUrl({access_type:"offline",prompt:"consent",scope:["https://www.googleapis.com/auth/spreadsheets.readonly"],state:user.id});
  return NextResponse.json({url});
 } catch(e:any) { return NextResponse.json({error:e.message||"Konfigurasi Google OAuth belum lengkap."},{status:500}); }
}