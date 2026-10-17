# CreatorFlow — online endorsement manager

CreatorFlow adalah aplikasi web responsif untuk mengelola endorsement bersama istri, pemilik workspace, dan admin/tim.

## Fitur dalam scaffold ini
- Login dan pendaftaran akun dengan Supabase Auth.
- Dashboard ringkas, tampilan tabel, dan Kanban 10 tahap.
- Input manual, detail pekerjaan, tautan grup WA/brief/script/draft/posting/insights.
- Perubahan tahap dengan riwayat.
- Status pembayaran terpisah dari tahap workflow.
- Impor Google Sheets menggunakan OAuth (read-only), pratinjau, dan deteksi nama brand yang sudah ada.
- Pembatasan data berdasarkan workspace melalui Supabase RLS.

## 10 tahap
1. Undangan masuk
2. Masuk grup WhatsApp
3. Menyiapkan script
4. Membuat draft konten
5. Mengirim draft ke grup
6. Review / revisi / approval
7. Konten diposting
8. Mengirim insights
9. Menunggu pembayaran
10. DONE ALL

## A. Menyiapkan Supabase
1. Buat project di https://supabase.com.
2. Buka SQL Editor dan jalankan `supabase/schema.sql`.
3. Di Project Settings > API, salin Project URL, anon/publishable key, dan service role key.
4. Isi `.env.local` berdasarkan `.env.example`.
5. Di Authentication > URL Configuration, set Site URL ke URL deploy dan tambahkan redirect URL `https://DOMAIN_ANDA/auth/callback`.
6. Daftarkan akun pertama lewat `/login`. Untuk aktivasi awal, buka SQL Editor dan jalankan:
   ```sql
   insert into public.workspaces (name) values ('CreatorFlow Endorsement') returning id;
   ```
   Gunakan UUID yang dikembalikan:
   ```sql
   insert into public.profiles (id, workspace_id, email, display_name, role)
   values ('UUID_AUTH_USER', 'UUID_WORKSPACE', 'email-anda@example.com', 'Admin', 'admin');
   ```
   UUID user dapat dilihat di Authentication > Users.
7. User lain mendaftar lewat `/login`, lalu admin menambahkannya di menu Pengaturan tim.

> Simpan `SUPABASE_SERVICE_ROLE_KEY` hanya di environment server hosting. Jangan pernah menaruhnya di kode frontend atau repository publik.

## B. Menyiapkan Google Sheets OAuth
1. Di https://console.cloud.google.com, buat project Google Cloud.
2. Aktifkan **Google Sheets API**.
3. Konfigurasikan OAuth consent screen. Tambahkan email tim sebagai test users bila aplikasi masih berstatus Testing.
4. Buat OAuth Client ID tipe **Web application**.
5. Authorized redirect URI harus sama persis dengan `GOOGLE_REDIRECT_URI`, yaitu `https://DOMAIN_ANDA/api/google/callback`.
6. Isi `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `NEXT_PUBLIC_APP_URL`, dan `APP_ENCRYPTION_SECRET` di environment hosting.
7. `APP_ENCRYPTION_SECRET` disiapkan untuk kebutuhan hardening token/enkripsi pada tahap produksi berikutnya; rotasi rahasia secara terencana.

Aplikasi meminta scope read-only `spreadsheets.readonly`. Google refresh token disimpan di tabel server-side `google_connections`, yang tidak bisa ditulis lewat browser. Untuk deployment publik, disarankan mengaktifkan enkripsi token at-rest/KMS dan meninjau kebijakan OAuth Google sesuai status publikasi aplikasi.

## C. Menjalankan lokal
```bash
npm install
cp .env.example .env.local
npm run dev
```
Buka http://localhost:3000.

## D. Deploy online ke Vercel
1. Push repository ke GitHub.
2. Import repository dari https://vercel.com.
3. Isi seluruh environment variables dari `.env.local` pada Vercel Project Settings.
4. Pastikan `GOOGLE_REDIRECT_URI` dan `NEXT_PUBLIC_APP_URL` menggunakan domain production yang benar.
5. Deploy, lalu masukkan domain produksi di Supabase Auth redirect allow-list dan Google OAuth redirect URI.

## Catatan kesiapan produksi
Ini adalah scaffold aplikasi yang dapat dikembangkan dan dideploy; bukan layanan yang sudah dihosting. Sebelum dipakai untuk data klien sungguhan, lakukan test end-to-end, enkripsi refresh token Google at-rest, tambahkan pembatasan rate, validasi URL dan audit keamanan. Untuk aplikasi OAuth yang masih Testing, refresh token Google bisa kedaluwarsa setelah periode tertentu. Gunakan akun Google yang tepat dan batasi akses spreadsheet secara sengaja.

## Struktur penting
- `src/app/page.tsx` — dashboard, tabel, Kanban
- `src/app/jobs/` — input manual dan detail job
- `src/app/import/` — alur OAuth, pilih sheet, preview, impor
- `src/app/team/` — anggota dan peran
- `src/app/api/google/` — OAuth callback dan Google Sheets API
- `supabase/schema.sql` — database dan RLS
