import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

async function getOrigin(): Promise<string> {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") || headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") || "https";
  if (host) {
    return `${proto}://${host}`;
  }
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string; reset?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/");

  const params = await searchParams;

  async function signIn(formData: FormData) {
    "use server";
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) redirect("/login?error=" + encodeURIComponent("Email atau kata sandi tidak valid."));
    redirect("/");
  }

  async function signUp(formData: FormData) {
    "use server";
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const origin = await getOrigin();

    if (!email || !password || password.length < 8) {
      redirect("/login?error=" + encodeURIComponent("Email dan kata sandi minimal 8 karakter wajib diisi."));
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      redirect("/login?error=" + encodeURIComponent(error.message));
    }

    if (data.session) {
      // Auto-signed in if email confirmation is disabled
      redirect("/");
    }

    redirect(
      "/login?notice=" +
        encodeURIComponent(
          "Pendaftaran berhasil! Tautan konfirmasi telah dikirim ke email Anda. Silakan periksa inbox atau spam."
        )
    );
  }

  async function resetPassword(formData: FormData) {
    "use server";
    const email = String(formData.get("email") || "").trim();
    if (!email) {
      redirect("/login?error=" + encodeURIComponent("Masukkan email akun Anda."));
    }

    const origin = await getOrigin();
    const supabase = await createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/reset-password`,
    });

    if (error) {
      redirect(
        "/login?error=" +
          encodeURIComponent("Gagal mengirim email pemulihan: " + error.message)
      );
    }

    redirect(
      "/login?notice=" +
        encodeURIComponent(
          "Jika email terdaftar, tautan pemulihan telah dikirim. Silakan periksa inbox dan folder spam Anda."
        )
    );
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 20 }}>
      <section className="panel" style={{ width: "100%", maxWidth: 430, padding: 28 }}>
        <div className="brand" style={{ padding: "0 0 20px" }}>
          Creator<span>Flow</span>
        </div>
        <div className="eyebrow">ENDORSEMENT WORKSPACE</div>
        <h1 style={{ fontSize: 27 }}>Masuk ke CreatorFlow</h1>
        <p className="sub">Satu tempat untuk mengelola brand, konten, dan pembayaran tim.</p>

        {params.error && <p className="notice error">{params.error}</p>}
        {params.notice && <p className="notice">{params.notice}</p>}
        {params.reset === "success" && (
          <p className="notice">Kata sandi berhasil diperbarui! Silakan masuk dengan kata sandi baru.</p>
        )}

        <form action={signIn} style={{ display: "grid", gap: 12, marginTop: 20 }}>
          <input className="field" name="email" type="email" placeholder="Email" required />
          <input
            className="field"
            name="password"
            type="password"
            placeholder="Password"
            minLength={8}
            required
          />
          <button className="btn primary" type="submit" style={{ justifyContent: "center" }}>
            Masuk
          </button>
        </form>

        <details style={{ marginTop: 18 }}>
          <summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
            Lupa kata sandi?
          </summary>
          <form action={resetPassword} style={{ display: "grid", gap: 12, marginTop: 12 }}>
            <input
              className="field"
              name="email"
              type="email"
              placeholder="Email akun CreatorFlow"
              required
            />
            <button className="btn" type="submit" style={{ justifyContent: "center" }}>
              Kirim tautan pemulihan
            </button>
          </form>
        </details>

        <details style={{ marginTop: 18 }}>
          <summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
            Buat akun baru
          </summary>
          <form action={signUp} style={{ display: "grid", gap: 12, marginTop: 12 }}>
            <input className="field" name="email" type="email" placeholder="Email" required />
            <input
              className="field"
              name="password"
              type="password"
              placeholder="Password minimal 8 karakter"
              minLength={8}
              required
            />
            <button className="btn" type="submit" style={{ justifyContent: "center" }}>
              Daftar
            </button>
          </form>
        </details>

        <p className="muted" style={{ marginTop: 18 }}>
          Akun baru otomatis tergabung ke workspace tim setelah mendaftar.
        </p>
      </section>
    </main>
  );
}
