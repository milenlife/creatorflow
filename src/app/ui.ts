export function formatIDR(n:number) {
  return new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(n||0);
}
export function paymentLabel(v:string) {
  return ({unpaid:"Belum dibayar",paid:"Lunas",barter:"Barter",partial:"Parsial",not_applicable:"Tidak berlaku"} as Record<string,string>)[v] || v;
}
export function stageName(v:string) {
  return ({invitation:"Undangan masuk",wa_group:"Grup WhatsApp",script:"Menyiapkan script",draft:"Membuat draft",submit_draft:"Kirim draft",review:"Review / approval",posted:"Sudah posting",insights:"Kirim insights",payment:"Menunggu pembayaran",done:"DONE ALL"} as Record<string,string>)[v] || v;
}
export function stagePill(v:string) { return v==="done"?"green":v==="payment"?"orange":""; }