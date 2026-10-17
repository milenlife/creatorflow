import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { STAGES } from "@/lib/stages";
import { signOut, updateStage } from "./actions";
import { formatIDR, paymentLabel, stagePill, stageName } from "@/lib/ui";
import { Plus, LayoutDashboard, Table2, FileSpreadsheet, Users, CircleDollarSign, Clock3 } from "lucide-react";

export default async function Dashboard({ searchParams }: {searchParams:Promise<{view?:string}>}) {
  const params = await searchParams;
  const view = params.view === "board" ? "board" : "table";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("workspace_id,role,display_name").eq("id",user.id).single();
  if (!profile?.workspace_id) return <main className="main"><section className="panel"><h1>Workspace belum disiapkan</h1><p className="sub">Akun sudah masuk, tetapi belum menjadi anggota workspace. Admin perlu menambahkan akun ke tabel <code>profiles</code> dengan workspace yang sesuai.</p><p className="muted">User ID: {user.id}</p></section></main>;
  const { data: jobs } = await supabase.from("endorsements").select("*").eq("workspace_id",profile.workspace_id).order("updated_at",{ascending:false});
  const all = jobs ?? [];
  const unpaid = all.filter(j => ["unpaid","partial"].includes(j.payment_status));
  const earned = all.filter(j => j.payment_status === "paid").reduce((sum,j)=>sum+Number(j.fee_idr||0),0);
  const active = all.filter(j=>j.stage!=="done").length;
  const money = (n:number)=>formatIDR(n);
  return <div className="shell">
    <aside className="sidebar">
      <div className="brand">Creator<span>Flow</span></div>
      <Link className="nav active" href="/"><LayoutDashboard size={17}/> Dashboard</Link>
      <Link className="nav" href="/jobs"><Table2 size={17}/> Semua endorsement</Link>
      <Link className="nav" href="/import"><FileSpreadsheet size={17}/> Impor Google Sheets</Link>
      <Link className="nav" href="/team"><Users size={17}/> Pengaturan tim</Link>
      <div className="side-note"><b>Workspace endorsement</b><br/>Alur 10 tahap untuk mengelola pekerjaan, deadline, dan pembayaran dalam satu tempat.</div>
      <form action={signOut} style={{marginTop:20,padding:"0 8px"}}><button className="btn" style={{width:"100%",justifyContent:"center"}} type="submit">Keluar</button></form>
    </aside>
    <main className="main">
      <header className="topbar"><div><div className="eyebrow">WORKSPACE / DASHBOARD</div><h1>Halo, {profile.display_name || user.email?.split("@")[0] || "Creator"} 👋</h1><div className="sub">Pantau seluruh endorsement dari undangan sampai pembayaran selesai.</div></div><Link className="btn primary" href="/jobs/new"><Plus size={16}/> Tambah job</Link></header>
      <section className="stats">
        <div className="stat"><div className="stat-label">Total endorsement</div><div className="stat-value">{all.length}</div><div className="muted">Semua brand terdaftar</div></div>
        <div className="stat"><div className="stat-label">Masih berjalan</div><div className="stat-value">{active}</div><div className="muted">Belum masuk DONE ALL</div></div>
        <div className="stat"><div className="stat-label">Menunggu pembayaran</div><div className="stat-value">{unpaid.length}</div><div className="muted">Termasuk pembayaran parsial</div></div>
        <div className="stat"><div className="stat-label">Pembayaran diterima</div><div className="stat-value" style={{fontSize:22}}>{money(earned)}</div><div className="muted">Fee job berstatus paid</div></div>
      </section>
      <section className="panel">
        <div className="panel-head"><div><div className="panel-title">Alur pekerjaan</div><div className="muted" style={{marginTop:5}}>Pilih tampilan tabel atau Kanban.</div></div><div className="toolbar"><Link className={`btn ${view==="table"?"primary":""}`} href="/?view=table"><Table2 size={15}/> Tabel</Link><Link className={`btn ${view==="board"?"primary":""}`} href="/?view=board"><LayoutDashboard size={15}/> Kanban</Link></div></div>
        {view==="table" ? <div className="table-wrap"><table><thead><tr><th>Brand</th><th>Platform</th><th>Tanggal posting</th><th>Fee</th><th>Tahap</th><th>Pembayaran</th></tr></thead><tbody>
          {all.slice(0,25).map((j:any)=><tr key={j.id}><td><Link href={`/jobs/${j.id}`} style={{fontWeight:800,textDecoration:"none"}}>{j.brand_name}</Link><div className="muted">{j.brand_handle||"Tanpa handle"}</div></td><td>{(j.platform||[]).join(", ")||"—"}</td><td>{j.posting_date||"—"}</td><td>{money(Number(j.fee_idr||0))}</td><td><span className={`pill ${stagePill(j.stage)}`}>{stageName(j.stage)}</span></td><td><span className={`pill ${j.payment_status==="paid"?"green":j.payment_status==="unpaid"?"orange":""}`}>{paymentLabel(j.payment_status)}</span></td></tr>)}
        </tbody></table>{all.length===0&&<div className="empty">Belum ada job. Tambahkan endorsement pertama atau impor dari Google Sheets.</div>}{all.length>25&&<div style={{paddingTop:14}}><Link className="btn" href="/jobs">Lihat semua {all.length} job</Link></div>}</div>
        : <div className="board">{STAGES.map(stage=><div className="stage-column" key={stage.key}><div className="stage-head"><span>{stage.short}</span><span className="pill">{all.filter(j=>j.stage===stage.key).length}</span></div>{all.filter(j=>j.stage===stage.key).map((j:any)=><Link key={j.id} href={`/jobs/${j.id}`} className="job-card" style={{display:"block",textDecoration:"none"}}><div className="job-brand">{j.brand_name}</div><div className="job-meta">{(j.platform||[]).join(", ")||"Platform belum diisi"}<br/>Posting: {j.posting_date||"Belum ditentukan"}</div><div className="job-fee">{money(Number(j.fee_idr||0))}</div><div style={{marginTop:8}}><span className={`pill ${j.payment_status==="paid"?"green":j.payment_status==="unpaid"?"orange":""}`}>{paymentLabel(j.payment_status)}</span></div></Link>)}</div>)}</div>}
      </section>
      <div className="muted">Masuk sebagai {user.email} · Peran: {profile.role}</div>
    </main>
  </div>;
}