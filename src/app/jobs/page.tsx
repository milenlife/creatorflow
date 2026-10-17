import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { STAGES } from "@/lib/stages";
import { formatIDR, paymentLabel, stageName, stagePill } from "@/app/ui";

export default async function JobsPage({searchParams}:{searchParams:Promise<{q?:string,stage?:string}>}) {
  const params=await searchParams, q=(params.q||"").toLowerCase(), stage=params.stage||"";
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser(); if(!user) redirect("/login");
  const {data:profile}=await supabase.from("profiles").select("workspace_id").eq("id",user.id).single();
  if(!profile?.workspace_id) return <main className="main"><div className="panel">Workspace belum disiapkan.</div></main>;
  const {data}=await supabase.from("endorsements").select("*").eq("workspace_id",profile.workspace_id).order("created_at",{ascending:false});
  const jobs=(data||[]).filter(j=>(!q||`${j.brand_name} ${j.brand_handle||""}`.toLowerCase().includes(q))&&(!stage||j.stage===stage));
  return <div className="shell"><aside className="sidebar"><div className="brand">Creator<span>Flow</span></div><Link className="nav" href="/">Dashboard</Link><Link className="nav active" href="/jobs">Semua endorsement</Link><Link className="nav" href="/import">Impor Google Sheets</Link><Link className="nav" href="/team">Pengaturan tim</Link></aside><main className="main">
    <header className="topbar"><div><div className="eyebrow">DATABASE PEKERJAAN</div><h1>Semua endorsement</h1><div className="sub">{jobs.length} job ditemukan. Pilih brand untuk melihat detail dan memperbarui tahap.</div></div><Link className="btn primary" href="/jobs/new">+ Tambah job</Link></header>
    <section className="panel"><form className="toolbar" method="get"><input className="field search" name="q" placeholder="Cari brand atau handle..." defaultValue={q}/><select className="field" name="stage" defaultValue={stage} style={{maxWidth:250}}><option value="">Semua tahap</option>{STAGES.map(s=><option key={s.key} value={s.key}>{s.label}</option>)}</select><button className="btn primary">Filter</button><Link className="btn" href="/jobs">Reset</Link></form>
    <div className="table-wrap" style={{marginTop:16}}><table><thead><tr><th>Brand</th><th>Platform</th><th>Fee</th><th>Posting</th><th>Tahap</th><th>Pembayaran</th></tr></thead><tbody>{jobs.map(j=><tr key={j.id}><td><Link href={`/jobs/${j.id}`} style={{fontWeight:800,textDecoration:"none"}}>{j.brand_name}</Link><div className="muted">{j.brand_handle||"—"}</div></td><td>{(j.platform||[]).join(", ")||"—"}</td><td>{formatIDR(Number(j.fee_idr||0))}</td><td>{j.posting_date||"—"}</td><td><span className={`pill ${stagePill(j.stage)}`}>{stageName(j.stage)}</span></td><td><span className={`pill ${j.payment_status==="paid"?"green":j.payment_status==="unpaid"?"orange":""}`}>{paymentLabel(j.payment_status)}</span></td></tr>)}</tbody></table>{jobs.length===0&&<div className="empty">Tidak ada job yang cocok.</div>}</div></section>
  </main></div>;
}