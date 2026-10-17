 "use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { STAGES } from "@/lib/stages";

async function currentWorkspace() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("workspace_id,role").eq("id", user.id).single();
  if (!profile?.workspace_id) throw new Error("Akun belum terhubung ke workspace. Minta admin menambahkan akun ini.");
  return { supabase, user, profile };
}
export async function createEndorsement(formData: FormData) {
  const { supabase, profile } = await currentWorkspace();
  const name = String(formData.get("brand_name") || "").trim();
  if (!name) throw new Error("Nama brand wajib diisi.");
  const platform = String(formData.get("platform") || "Lainnya").split(",").map(x => x.trim()).filter(Boolean);
  const fee = Math.max(0, Number(formData.get("fee_idr") || 0));
  const { data, error } = await supabase.from("endorsements").insert({
    workspace_id: profile.workspace_id, brand_name: name,
    brand_handle: String(formData.get("brand_handle") || "").trim() || null,
    platform, fee_idr: Number.isFinite(fee) ? fee : 0,
    stage: String(formData.get("stage") || "invitation"),
    posting_date: String(formData.get("posting_date") || "") || null,
    payment_status: String(formData.get("payment_status") || "unpaid"),
    payment_due_date: String(formData.get("payment_due_date") || "") || null,
    notes: String(formData.get("notes") || "").trim() || null,
    wa_group_url: String(formData.get("wa_group_url") || "").trim() || null
  }).select("id").single();
  if (error) throw new Error(error.message);
  await supabase.from("status_history").insert({workspace_id:profile.workspace_id, endorsement_id:data.id, from_stage:null, to_stage:String(formData.get("stage") || "invitation"), changed_by:(await supabase.auth.getUser()).data.user?.id});
  revalidatePath("/");
  revalidatePath("/jobs");
  redirect("/jobs/" + data.id);
}
export async function updateStage(formData: FormData) {
  const { supabase, profile, user } = await currentWorkspace();
  const id = String(formData.get("id") || "");
  const next = String(formData.get("stage") || "");
  if (!STAGES.some(s => s.key === next)) throw new Error("Tahap tidak valid.");
  const { data: existing, error: readError } = await supabase.from("endorsements").select("stage").eq("id", id).eq("workspace_id", profile.workspace_id).single();
  if (readError || !existing) throw new Error("Job tidak ditemukan.");
  const { error } = await supabase.from("endorsements").update({stage:next}).eq("id",id).eq("workspace_id",profile.workspace_id);
  if (error) throw new Error(error.message);
  await supabase.from("status_history").insert({workspace_id:profile.workspace_id, endorsement_id:id, from_stage:existing.stage, to_stage:next, changed_by:user.id});
  revalidatePath("/");
  revalidatePath("/jobs");
  revalidatePath("/jobs/" + id);
}
export async function updatePayment(formData: FormData) {
  const { supabase, profile } = await currentWorkspace();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("payment_status") || "");
  if (!["unpaid","paid","barter","partial","not_applicable"].includes(status)) throw new Error("Status pembayaran tidak valid.");
  const { error } = await supabase.from("endorsements").update({payment_status:status}).eq("id",id).eq("workspace_id",profile.workspace_id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/jobs");
  revalidatePath("/jobs/" + id);
}
export async function updateJobLinks(formData: FormData) {
  const { supabase, profile } = await currentWorkspace();
  const id = String(formData.get("id") || "");
  const fields = ["wa_group_url","brief_url","script_url","draft_url","post_url","insights_url"] as const;
  const update: Record<string,string|null> = {};
  for (const field of fields) update[field] = String(formData.get(field) || "").trim() || null;
  const { error } = await supabase.from("endorsements").update(update).eq("id",id).eq("workspace_id",profile.workspace_id);
  if (error) throw new Error(error.message);
  revalidatePath("/jobs/" + id);
}
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}