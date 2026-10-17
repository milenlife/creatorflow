import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TeamClient from "./ui";

export default async function TeamPage() {
 const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user)redirect("/login");
 const {data:profile}=await supabase.from("profiles").select("workspace_id,role").eq("id",user.id).single();
 if(!profile?.workspace_id)return <main className="main"><div className="panel">Workspace belum disiapkan.</div></main>;
 const {data:members}=await supabase.from("profiles").select("id,email,display_name,role,created_at").eq("workspace_id",profile.workspace_id).order("created_at");
 return <div className="shell"><aside className="sidebar"><div className="brand">Creator<span>Flow</span></div><Link className="nav" href="/">Dashboard</Link><Link className="nav" href="/jobs">Semua endorsement</Link><Link className="nav" href="/import">Impor Google Sheets</Link><Link className="nav active" href="/team">Pengaturan tim</Link></aside><main className="main"><header className="topbar"><div><div className="eyebrow">AKSES WORKSPACE</div><h1>Pengaturan tim</h1><div className="sub">Kelola akses istri, pemilik workspace, dan anggota admin/tim.</div></div><Link className="btn" href="/">← Dashboard</Link></header><section className="panel"><div className="panel-title">Anggota workspace</div><p className="sub">Saat ini hanya admin workspace yang boleh mengundang atau mengubah peran. Tambahkan anggota memakai email akun yang sudah mendaftar.</p><TeamClient role={profile.role}/><div className="table-wrap" style={{marginTop:18}}><table><thead><tr><th>Nama</th><th>Email</th><th>Peran</th></tr></thead><tbody>{(members||[]).map(m=><tr key={m.id}><td>{m.display_name||"—"}</td><td>{m.email||"—"}</td><td><span className="pill">{m.role}</span></td></tr>)}</tbody></table></div></section></main></div>;
}