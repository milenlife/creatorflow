export function formatIDR(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function paymentLabel(status: string | null | undefined): string {
  switch (status) {
    case "paid":
      return "Lunas";
    case "partial":
      return "Dibayar sebagian";
    case "unpaid":
      return "Belum dibayar";
    case "barter":
      return "Barter";
    case "not_applicable":
      return "Tidak berlaku";
    default:
      return "Belum ditentukan";
  }
}

export function stageName(stage: string | null | undefined): string {
  const names: Record<string, string> = {
    invitation: "1. Undangan masuk",
    wa_group: "2. Masuk grup WhatsApp",
    script: "3. Menyiapkan script",
    draft: "4. Membuat draft konten",
    submit_draft: "5. Kirim draft ke grup",
    review: "6. Review / revisi / approval",
    posted: "7. Konten diposting",
    insights: "8. Kirim insights",
    payment: "9. Menunggu pembayaran",
    done: "10. DONE ALL",
  };
  return names[stage ?? ""] ?? stage ?? "Belum ditentukan";
}

export function stagePill(stage: string | null | undefined): string {
  switch (stage) {
    case "done":
      return "green";
    case "payment":
      return "orange";
    case "posted":
    case "insights":
      return "blue";
    case "review":
      return "purple";
    default:
      return "";
  }
}
