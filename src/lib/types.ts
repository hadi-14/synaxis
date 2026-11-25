export type Module = {
  id: number;
  slug: string;
  name: string;
  subject: string;
  character: string;
  accent: string;
  motif: string;
  tagline: string;
  description: string;
  format: string;
  team_size_note: string;
  schedule_slot: string;
  head_name: string;
  cohead_name: string;
  capacity: number | null;
  is_compulsory: boolean;
  is_active: boolean;
  sort: number;
  category_id: number | null;
};

export type Settings = {
  season_label: string;
  event_start: string;
  event_end: string;
  venue_name: string;
  venue_address: string;
  venue_map_url: string;
  delegation_fee: number;
  early_fee: number;
  regular_fee: number;
  registration_opens_at: string;
  early_bird_deadline: string;
  registration_closes_at: string;
  payment_deadline: string;
  team_min: number;
  team_max: number;
  modules_min: number;
  modules_max: number;
  best_institute_min_teams: number;
  registration_open: boolean;
  internal_email_domain: string;
  announcement: string;
  announcement_active: boolean;
  contact_email: string;
  contact_whatsapp: string;
  instagram_url: string;
  waiver_template_url: string;
};

export type Faq = { id: number; question: string; answer: string; category: string; sort: number; is_published: boolean };

export type CouncilMember = {
  id: number;
  name: string;
  role: string;
  tier: "executive" | "module";
  module_id: number | null;
  photo_url: string | null;
  instagram: string | null;
  linkedin: string | null;
  email: string | null;
  bio: string | null;
  sort: number;
  is_published: boolean;
};

export type Sponsor = {
  id: number;
  name: string;
  tier: "title" | "platinum" | "gold" | "community" | "partner";
  logo_url: string | null;
  url: string | null;
  blurb: string | null;
  sort: number;
  is_published: boolean;
};

export type TeamStatus =
  | "draft"
  | "pending_payment"
  | "under_review"
  | "verified"
  | "rejected"
  | "reupload_requested"
  | "waiver_pending"
  | "modules_allocated"
  | "cancelled"
  | "checked_in";

export const STATUS_LABEL: Record<TeamStatus, string> = {
  draft: "Draft",
  pending_payment: "Awaiting payment",
  under_review: "Receipt under review",
  verified: "Verified",
  rejected: "Payment rejected",
  reupload_requested: "Re-upload requested",
  waiver_pending: "Waivers pending",
  modules_allocated: "Modules allocated",
  cancelled: "Cancelled",
  checked_in: "Checked in",
};

export type PaymentDetails = {
  bank_name: string;
  account_title: string;
  account_number: string;
  iban: string;
  receipt_whatsapp: string;
  instructions: string;
};
