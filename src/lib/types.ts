import type { StageKey } from "./stages";

export type Role = "wife" | "owner" | "admin" | "team";
export type PaymentStatus = "unpaid" | "paid" | "barter" | "partial" | "not_applicable";
export type Platform = "Instagram" | "TikTok" | "Shopee" | "YouTube" | "Lainnya";

export type Endorsement = {
  id: string;
  brand_name: string;
  brand_handle: string | null;
  platform: string[];
  fee_idr: number;
  stage: StageKey;
  posting_date: string | null;
  payment_status: PaymentStatus;
  payment_due_date: string | null;
  notes: string | null;
  wa_group_url: string | null;
  brief_url: string | null;
  script_url: string | null;
  draft_url: string | null;
  post_url: string | null;
  insights_url: string | null;
  created_at: string;
  updated_at: string;
};