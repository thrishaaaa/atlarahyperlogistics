-- The public careers form uses the anonymous Supabase client.  It uploads a
-- resume before inserting the application record, so both operations must
-- have an explicit `anon` RLS policy.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resumes',
  'resumes',
  false,
  10485760,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do nothing;

alter table public.applications enable row level security;

drop policy if exists "Public users can submit applications" on public.applications;
drop policy if exists "Anonymous users can submit applications" on public.applications;
create policy "Public users can submit applications"
on public.applications
for insert
to public
with check (true);

drop policy if exists "Public users can upload resumes" on storage.objects;
drop policy if exists "Anonymous users can upload resumes" on storage.objects;
create policy "Public users can upload resumes"
on storage.objects
for insert
to public
with check (bucket_id = 'resumes');
