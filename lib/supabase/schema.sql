-- Supabase SQL schema for Arbeidsnorsk-appen
-- Run this in Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- COMPANIES
create table companies (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  website_url text,
  logo_url text,
  primary_color text default '#1a56db',
  secondary_color text default '#e1effe',
  accent_color text default '#f59e0b',
  font_family text default 'Inter',
  industry text,
  description text,
  key_terms text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- COMPANY DOCUMENTS
create table company_documents (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade not null,
  file_name text not null,
  file_url text not null,
  file_type text not null,
  document_type text check (document_type in ('instruction', 'manual', 'hms', 'design', 'other')) default 'other',
  extracted_text text,
  file_size integer,
  created_at timestamptz default now()
);

-- GENERATION REQUESTS
create table generation_requests (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  cefr_level text check (cefr_level in ('A1', 'A2', 'B1')) not null,
  mother_tongue text not null,
  topics text[] default '{}',
  document_ids uuid[] default '{}',
  status text check (status in ('pending', 'processing', 'completed', 'error')) default 'pending',
  output_docx_url text,
  output_pptx_url text,
  output_html_url text,
  error_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ROW LEVEL SECURITY
alter table companies enable row level security;
alter table company_documents enable row level security;
alter table generation_requests enable row level security;

-- RLS POLICIES: Companies
create policy "Users can view own companies"
  on companies for select using (auth.uid() = user_id);

create policy "Users can insert own companies"
  on companies for insert with check (auth.uid() = user_id);

create policy "Users can update own companies"
  on companies for update using (auth.uid() = user_id);

create policy "Users can delete own companies"
  on companies for delete using (auth.uid() = user_id);

-- RLS POLICIES: Documents
create policy "Users can view own documents"
  on company_documents for select
  using (
    exists (
      select 1 from companies c
      where c.id = company_documents.company_id
      and c.user_id = auth.uid()
    )
  );

create policy "Users can insert own documents"
  on company_documents for insert
  with check (
    exists (
      select 1 from companies c
      where c.id = company_documents.company_id
      and c.user_id = auth.uid()
    )
  );

create policy "Users can delete own documents"
  on company_documents for delete
  using (
    exists (
      select 1 from companies c
      where c.id = company_documents.company_id
      and c.user_id = auth.uid()
    )
  );

-- RLS POLICIES: Generation requests
create policy "Users can view own generations"
  on generation_requests for select using (auth.uid() = user_id);

create policy "Users can insert own generations"
  on generation_requests for insert with check (auth.uid() = user_id);

create policy "Users can update own generations"
  on generation_requests for update using (auth.uid() = user_id);

-- STORAGE BUCKETS
-- Run these in Supabase dashboard > Storage:
-- 1. Create bucket: "company-documents" (private)
-- 2. Create bucket: "company-logos" (public)
-- 3. Create bucket: "generated-outputs" (private)

-- Storage policies (run after creating buckets)
create policy "Users can upload company documents"
  on storage.objects for insert
  with check (
    bucket_id = 'company-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can view own documents"
  on storage.objects for select
  using (
    bucket_id = 'company-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can upload logos"
  on storage.objects for insert
  with check (bucket_id = 'company-logos' and auth.role() = 'authenticated');

create policy "Anyone can view logos"
  on storage.objects for select
  using (bucket_id = 'company-logos');

create policy "Users can access own outputs"
  on storage.objects for all
  using (
    bucket_id = 'generated-outputs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- FUNCTION: Update updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_companies_updated_at
  before update on companies
  for each row execute procedure update_updated_at_column();

create trigger update_generation_requests_updated_at
  before update on generation_requests
  for each row execute procedure update_updated_at_column();
