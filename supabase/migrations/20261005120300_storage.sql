-- Storage (docs/PRODUCT.md, Seção 6): bucket público, escrita só admin

insert into storage.buckets (id, name, public)
values ('perfume-images', 'perfume-images', true)
on conflict (id) do nothing;

create policy "perfume-images: public select" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'perfume-images');

create policy "perfume-images: admin insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'perfume-images' and public.is_admin());

create policy "perfume-images: admin update" on storage.objects
  for update to authenticated
  using (bucket_id = 'perfume-images' and public.is_admin())
  with check (bucket_id = 'perfume-images' and public.is_admin());

create policy "perfume-images: admin delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'perfume-images' and public.is_admin());
