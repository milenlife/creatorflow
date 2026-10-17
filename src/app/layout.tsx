import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "CreatorFlow — Endorsement Manager",
  description: "Kelola endorsement, konten, dan pembayaran kreator dalam satu tempat."
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}