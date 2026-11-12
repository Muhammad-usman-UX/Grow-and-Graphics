-- Grow and Graphics: run this once in Supabase > SQL Editor.
create extension if not exists "pgcrypto";

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  product text not null check (product in ('logo-design','instagram-post','facebook-banner','ui-ux-audit')),
  client_name text not null,
  client_email text not null,
  client_whatsapp text not null,
  whatsapp_norm text not null,
  price integer not null default 0,
  status text not null default 'Client Confirmed',
  revision_count integer not null default 0,
  ai_prompt text,
  admin_note text,
  client_request text,
  client_reply text,
  delivered_at timestamptz,
  followup_sent boolean not null default false,
  created_at timestamptz not null default now()
);

-- 1 free order per product per email or WhatsApp number
create unique index if not exists orders_one_per_email on public.orders (product, lower(client_email));
create unique index if not exists orders_one_per_whatsapp on public.orders (product, whatsapp_norm);
create index if not exists orders_status_idx on public.orders (status, created_at desc);

create table if not exists public.order_details (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  field_name text not null,
  field_value text not null,
  unique (order_id, field_name)
);

create table if not exists public.drafts (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  file_url text not null,           -- storage path inside the private "drafts" bucket
  file_type text not null,          -- image/png, image/jpeg, application/pdf
  label text,                       -- e.g. concept-1-primary, banner, audit
  version integer not null default 1,
  status text not null default 'pending_admin' check (status in ('pending_admin','approved','rejected','final')),
  admin_note text,
  created_at timestamptz not null default now()
);
create index if not exists drafts_order_idx on public.drafts (order_id, version);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product text not null,
  rating integer not null check (rating between 1 and 5),
  name text not null,
  comment text not null,
  private_feedback text,
  approved boolean not null default false,
  google_review_clicked boolean not null default false,
  google_review_done boolean not null default false,
  created_at timestamptz not null default now(),
  unique (order_id)
);

-- Lock everything: only the server (service role key) can touch these tables.
alter table public.orders enable row level security;
alter table public.order_details enable row level security;
alter table public.drafts enable row level security;
alter table public.reviews enable row level security;

-- Private storage bucket for uploads and generated files.
insert into storage.buckets (id, name, public)
values ('drafts', 'drafts', false)
on conflict (id) do nothing;

-- ===== Batch 2 additions (safe to run on a fresh project or on top of batch 1) =====
alter table public.orders add column if not exists client_change_note text;
alter table public.orders add column if not exists round_note text;
alter table public.orders add column if not exists gen_round integer not null default 0;
alter table public.orders add column if not exists gen_lock timestamptz;
alter table public.orders add column if not exists gen_error text;
create unique index if not exists drafts_unique_label on public.drafts (order_id, version, label);
