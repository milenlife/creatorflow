
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

    async function checkRecoverySession() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          if (active) {
            setMessage(
              "Tautan pemulihan tidak valid atau sudah kedaluwarsa. Minta email pemulihan baru."
            );
          }
          return;
        }
      }

      const { data, error } = await supabase.auth.getSession();

      if (!active) return;

      if (!error && data.session) {
        setReady(true);
      } else {
        setMessage(
          "Sesi pemulihan tidak ditemukan. Minta email pemulihan baru dan buka tautannya kembali."
        );
      }
    }

    checkRecoverySession();

    return () => {
      active = false;
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
      <section className="panel">
        <h1>Atur ulang kata sandi</h1>
        <p className="sub">
          Buat kata sandi baru untuk akun CreatorFlow kamu.
        </p>

        {!ready && !message && (
          <p className="muted">Memeriksa tautan pemulihan...</p>
        )}

        {ready && (
          <form onSubmit={handleSubmit}>
            <label htmlFor="password">Kata sandi baru</label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: "100%", margin: "8px 0 16px" }}
            />

            <label htmlFor="confirmPassword">
              Ulangi kata sandi baru
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{ width: "100%", margin: "8px 0 16px" }}
            />

            <button className="btn primary" type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan kata sandi baru"}
            </button>
          </form>
        )}

        {message && (
          <p role="alert" style={{ marginTop: 16 }}>
            {message}
          </p>
        )}

        <p style={{ marginTop: 20 }}>
          <Link href="/login">Kembali ke login</Link>
        </p>
      </section>
    </main>
  );
}
