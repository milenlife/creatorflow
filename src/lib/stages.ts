export const STAGES = [
  { key: "invitation", label: "1. Undangan masuk", short: "Undangan" },
  { key: "wa_group", label: "2. Masuk grup WhatsApp", short: "Grup WA" },
  { key: "script", label: "3. Menyiapkan script", short: "Script" },
  { key: "draft", label: "4. Membuat draft konten", short: "Draft" },
  { key: "submit_draft", label: "5. Kirim draft ke grup", short: "Kirim draft" },
  { key: "review", label: "6. Review / revisi / approval", short: "Review" },
  { key: "posted", label: "7. Konten diposting", short: "Posting" },
  { key: "insights", label: "8. Kirim insights", short: "Insights" },
  { key: "payment", label: "9. Menunggu pembayaran", short: "Pembayaran" },
  { key: "done", label: "10. DONE ALL", short: "Selesai" }
] as const;

export type StageKey = typeof STAGES[number]["key"];
export const stageLabel = (key: string) => STAGES.find(s => s.key === key)?.label ?? key;
