import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
export async function POST(request:Request) {
 try {
  const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user)return NextResponse.json({error:"Tidak terautentikasi."},{status:401});
  const {data:profile}=await supabase.from("profiles").select("workspace_id,role").eq("id",user.id).single();
  if(!profile||profile.role!=="admin")return NextResponse.json({error:"Hanya admin yang dapat mengelola anggota."},{status:403});
  const {email,role}=await request.json(); if(!["wife","owner","admin","team"].includes(role))return NextResponse.json({error:"Peran tidak valid."},{status:400});
  const admin=createAdminClient(); const {data:users,error}=await admin.auth.admin.listUsers({page:1,perPage:1000}); if(error)throw error;
  const target=users.users.find(u=>u.email?.toLowerCase()===String(email).toLowerCase());
  if(!target)return NextResponse.json({error:"Email belum mendaftar. Minta anggota membuat akun terlebih dahulu."},{status:404});
  const {error:saveError}=await admin.from("profiles").upsert({id:target.id,email:target.email,workspace_id:profile.workspace_id,role,updated_at:new Date().toISOString()},{onConflict:"id"});
  if(saveError)throw saveError;
  return NextResponse.json({ok:true});
 } catch(e:any){return NextResponse.json({error:e.message||"Gagal menambahkan anggota."},{status:400});}
}