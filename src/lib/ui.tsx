
export function formatIDR(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function paymentLabel(status: string | null | undefined): string {
  switch (status) {
    case "paid":
      return "Lunas";
    case "partial":
      return "Dibayar sebagian";
    case "unpaid":
      return "Belum dibayar";
    default:
      return "Belum ditentukan";
  }
}

export function stageName(stage: string | null | undefined): string {
  const names: Record<string, string> = {
    invitation: "Undangan WhatsApp",
    group_added: "Masuk grup WhatsApp",
    script: "Pembuatan script",
    draft_content: "Pembuatan konten",
    submit_draft: "Kirim draft",
    revision: "Revisi / persetujuan",
    approved: "Disetujui",
    posted: "Sudah posting",
    insights: "Kirim insight",
    awaiting_payment: "Menunggu pembayaran",
    done: "DONE ALL",
  };

  return names[stage ?? ""] ?? stage ?? "Belum ditentukan";
}

export function stagePill(stage: string | null | undefined): string {
  switch (stage) {
    case "done":
      return "green";
    case "awaiting_payment":
      return "orange";
    case "posted":
    case "insights":
    case "approved":
      return "blue";
    default:
      return "";
  }
}
