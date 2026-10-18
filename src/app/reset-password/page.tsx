"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const supabase = createClient();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    // 1. Listen for Supabase recovery / auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!active) return;
        if (event === "PASSWORD_RECOVERY" || (session && session.user)) {
          setReady(true);
          setMessage("");
        }
      }
    );

    async function checkRecovery() {
      // 2. Check query parameters (PKCE code)
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          if (active) {
            setMessage(
              "Tautan pemulihan tidak valid atau sudah kedaluwarsa. Silakan minta tautan baru dari halaman login."
            );
          }
          return;
        }
        if (active) {
          setReady(true);
          return;
        }
      }

      // 3. Check URL hash fragment (Implicit token flow)
      const hash = window.location.hash;
      if (hash && hash.includes("access_token")) {
        const hashParams = new URLSearchParams(hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (!error && active) {
            setReady(true);
            return;
          }
        }
      }

      // 4. Check existing session
      const { data, error } = await supabase.auth.getSession();
      if (!active) return;
      if (!error && data.session) {
        setReady(true);
      } else {
        // Wait a brief moment in case onAuthStateChange is processing the URL hash
        setTimeout(async () => {
          if (!active) return;
          const { data: delayedData } = await supabase.auth.getSession();
          if (delayedData?.session) {
            setReady(true);
          } else if (!ready) {
            setMessage(
              "Sesi pemulihan tidak ditemukan. Pastikan Anda membuka tautan terbaru yang dikirimkan ke email Anda."
            );
          }
        }, 1200);
      }
    }

    checkRecovery();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    if (password.length < 8) {
      setMessage("Kata sandi harus minimal 8 karakter.");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("Kedua kata sandi tidak sama.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setMessage("Gagal memperbarui kata sandi: " + error.message);
      return;
    }

    await supabase.auth.signOut();
    router.replace("/login?reset=success");
  }

  return (
    <main className="main" style={{ maxWidth: 480, margin: "60px auto" }}>
      <section className="panel" style={{ padding: 28 }}>
        <div className="brand" style={{ padding: "0 0 16px" }}>
          Creator<span>Flow</span>
        </div>
        <h1 style={{ fontSize: 24, margin: "0 0 6px" }}>Atur ulang kata sandi</h1>
        <p className="sub" style={{ margin: "0 0 20px" }}>
          Buat kata sandi baru untuk akun CreatorFlow Anda.
        </p>

        {!ready && !message && (
          <p className="muted">Memeriksa tautan pemulihan akun...</p>
        )}

        {ready && (
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
            <div className="form-field">
              <label htmlFor="password">Kata sandi baru</label>
              <input
                id="password"
                className="field"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                placeholder="Minimal 8 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label htmlFor="confirmPassword">Ulangi kata sandi baru</label>
              <input
                id="confirmPassword"
                className="field"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                placeholder="Ulangi kata sandi yang sama"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button className="btn primary" type="submit" disabled={loading} style={{ justifyContent: "center", marginTop: 6 }}>
              {loading ? "Menyimpan kata sandi..." : "Simpan kata sandi baru"}
            </button>
          </form>
        )}

        {message && (
          <p className="notice error" role="alert" style={{ marginTop: 16 }}>
            {message}
          </p>
        )}

        <p style={{ marginTop: 24 }}>
          <Link href="/login" className="btn" style={{ fontSize: 12 }}>
            ← Kembali ke halaman login
          </Link>
        </p>
      </section>
    </main>
  );
}
