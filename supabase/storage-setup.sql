-- Run this once in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
-- Creates a private bucket for ID/document scans uploaded via My Essentials,
-- and scopes access so each user can only read/write their own files.

insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', false)
on conflict (id) do nothing;

create policy "Users can upload their own files"
on storage.objects for insert
to authenticated
with check (bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can view their own files"
on storage.objects for select
to authenticated
using (bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can update their own files"
on storage.objects for update
to authenticated
using (bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete their own files"
on storage.objects for delete
to authenticated
using (bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text);
