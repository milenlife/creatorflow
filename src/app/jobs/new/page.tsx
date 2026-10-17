import Link from "next/link";
import { createEndorsement } from "@/app/actions";
import { STAGES } from "@/lib/stages";

export default function NewJobPage() {
  return <div className="shell"><aside className="sidebar"><div className="brand">Creator<span>Flow</span></div><Link className="nav" href="/">Dashboard</Link><Link className="nav active" href="/jobs">Semua endorsement</Link><Link className="nav" href="/import">Impor Google Sheets</Link><Link className="nav" href="/team">Pengaturan tim</Link></aside><main className="main">
    <header className="topbar"><div><div className="eyebrow">ENDORSEMENT BARU</div><h1>Tambah job</h1><div className="sub">Masukkan detail dasar; tautan dan tahap bisa diperbarui kapan saja.</div></div><Link className="btn" href="/jobs">← Kembali</Link></header>
    <section className="panel"><form action={createEndorsement} className="form-grid">
      <div className="form-field"><label>Nama brand *</label><input className="field" name="brand_name" required placeholder="Contoh: Gently Baby"/></div>
      <div className="form-field"><label>Handle brand</label><input className="field" name="brand_handle" placeholder="@brand"/></div>
      <div className="form-field"><label>Platform</label><select className="field" name="platform"><option>TikTok</option><option>Instagram</option><option>TikTok,Instagram</option><option>Shopee</option><option>YouTube</option><option>Lainnya</option></select></div>
      <div className="form-field"><label>Fee (Rupiah)</label><input className="field" name="fee_idr" type="number" min="0" defaultValue="0"/></div>
      <div className="form-field"><label>Tanggal posting</label><input className="field" name="posting_date" type="date"/></div>
      <div className="form-field"><label>Deadline pembayaran</label><input className="field" name="payment_due_date" type="date"/></div>
      <div className="form-field"><label>Status pembayaran</label><select className="field" name="payment_status" defaultValue="unpaid"><option value="unpaid">Belum dibayar</option><option value="paid">Lunas</option><option value="barter">Barter</option><option value="partial">Parsial</option><option value="not_applicable">Tidak berlaku</option></select></div>
      <div className="form-field"><label>Tahap saat ini</label><select className="field" name="stage">{STAGES.map(s=><option key={s.key} value={s.key}>{s.label}</option>)}</select></div>
      <div className="form-field full"><label>Link grup WhatsApp (opsional)</label><input className="field" name="wa_group_url" type="url" placeholder="https://chat.whatsapp.com/..."/></div>
      <div className="form-field full"><label>Catatan</label><textarea className="field" name="notes" rows={3} placeholder="Brief, catatan revisi, kontak PIC, dan lainnya"/></div>
      <div className="form-field full" style={{display:"flex",gap:10}}><button className="btn primary" type="submit">Simpan endorsement</button><Link className="btn" href="/jobs">Batal</Link></div>
    </form></section>
  </main></div>;
}