import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ImportClient from "./ui";

export default async function ImportPage() {
 const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user) redirect("/login");
 const {data:profile}=await supabase.from("profiles").select("workspace_id,role").eq("id",user.id).single();
 if(!profile?.workspace_id) return <main className="main"><div className="panel">Workspace belum disiapkan.</div></main>;
 return <div className="shell"><aside className="sidebar"><div className="brand">Creator<span>Flow</span></div><Link className="nav" href="/">Dashboard</Link><Link className="nav" href="/jobs">Semua endorsement</Link><Link className="nav active" href="/import">Impor Google Sheets</Link><Link className="nav" href="/team">Pengaturan tim</Link></aside><main className="main"><header className="topbar"><div><div className="eyebrow">MIGRASI DATA</div><h1>Impor Google Sheets</h1><div className="sub">Hubungkan akun Google melalui OAuth, pilih spreadsheet, tinjau data, lalu impor.</div></div><Link className="btn" href="/">← Dashboard</Link></header><ImportClient /></main></div>;
}