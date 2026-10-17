import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/");
  const params = await searchParams;
  async function signIn(formData: FormData) {
    "use server";
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) redirect("/login?error=Email%20atau%20password%20tidak%20valid");
    redirect("/");
  }
  async function signUp(formData: FormData) {
    "use server";
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");
    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) redirect("/login?error=" + encodeURIComponent(error.message));
    redirect("/login?error=Periksa%20email%20untuk%20konfirmasi%20akun%20jika%20diaktifkan");
  }
  return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:20}}>
    <section className="panel" style={{width:"100%",maxWidth:430,padding:28}}>
      <div className="brand" style={{padding:"0 0 20px"}}>Creator<span>Flow</span></div>
      <div className="eyebrow">ENDORSEMENT WORKSPACE</div>
      <h1 style={{fontSize:27}}>Masuk ke CreatorFlow</h1>
      <p className="sub">Satu tempat untuk mengelola brand, konten, dan pembayaran tim.</p>
      {params.error && <p className="notice error">{params.error}</p>}
      <form action={signIn} style={{display:"grid",gap:12,marginTop:20}}>
        <input className="field" name="email" type="email" placeholder="Email" required />
        <input className="field" name="password" type="password" placeholder="Password" minLength={8} required />
        <button className="btn primary" type="submit" style={{justifyContent:"center"}}>Masuk</button>
      </form>
      <details style={{marginTop:18}}>
        <summary style={{cursor:"pointer",fontSize:13,fontWeight:700}}>Buat akun baru</summary>
        <form action={signUp} style={{display:"grid",gap:12,marginTop:12}}>
          <input className="field" name="email" type="email" placeholder="Email" required />
          <input className="field" name="password" type="password" placeholder="Password minimal 8 karakter" minLength={8} required />
          <button className="btn" type="submit" style={{justifyContent:"center"}}>Daftar</button>
        </form>
      </details>
      <p className="muted" style={{marginTop:18}}>Akun baru perlu ditambahkan ke workspace oleh admin sebelum dapat mengakses data endorsement.</p>
    </section>
  </main>;
}