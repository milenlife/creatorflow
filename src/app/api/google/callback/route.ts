import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getGoogleOAuthClient, encryptSecret } from "@/lib/google";

export async function GET(request:Request) {
 const url=new URL(request.url), code=url.searchParams.get("code"), state=url.searchParams.get("state"), error=url.searchParams.get("error");
 const origin=process.env.NEXT_PUBLIC_APP_URL||url.origin;
 if(error||!code||!state) return NextResponse.redirect(new URL("/import?google=cancelled",origin));
 try {
  const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser();
  if(!user||user.id!==state) return NextResponse.redirect(new URL("/import?google=state_mismatch",origin));
  const oauth=getGoogleOAuthClient(); const {tokens}=await oauth.getToken(code);
  if(!tokens.refresh_token) return NextResponse.redirect(new URL("/import?google=missing_refresh_token",origin));
  // Keep long-lived refresh tokens server-side only; never return them to the browser.
  const admin=createAdminClient();
  const {error:saveError}=await admin.from("google_connections").upsert({user_id:user.id,refresh_token:encryptSecret(tokens.refresh_token),scope:tokens.scope||"",updated_at:new Date().toISOString()},{onConflict:"user_id"});
  if(saveError) throw saveError;
  return NextResponse.redirect(new URL("/import?google=connected",origin));
 } catch(e) { console.error("Google OAuth callback failed",e); return NextResponse.redirect(new URL("/import?google=error",origin)); }
}