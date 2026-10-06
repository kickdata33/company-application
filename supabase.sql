create extension if not exists pgcrypto;

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  first_name_th text not null,
  last_name_th text not null,
  first_name_en text not null,
  last_name_en text not null,
  skills text not null,
  id_front text not null,
  id_back text not null,
  house_registration text not null,
  status text not null default 'new',
  ai_analysis text,
  selected_company_name text,
  selected_email text
);

alter table public.applications enable row level security;

-- No public table policies are intentionally created.
-- All writes/reads go through trusted server routes using the service-role key.

insert into storage.buckets (id, name, public)
values ('application-documents','application-documents',false)
on conflict (id) do update set public=false;
