-- Funções e triggers (docs/PRODUCT.md, Seções 5 e 6)

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.brands
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.perfumes
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.notes
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.collection_items
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.perfume_reviews
  for each row execute function public.set_updated_at();

-- search_name = nome sem acento e minúsculo (unaccent é STABLE: não entra direto em índice)
create function public.set_search_name()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.search_name := lower(extensions.unaccent('extensions.unaccent', new.name));
  return new;
end $$;

create trigger set_search_name before insert or update of name on public.brands
  for each row execute function public.set_search_name();
create trigger set_search_name before insert or update of name on public.perfumes
  for each row execute function public.set_search_name();

-- Cria o perfil no cadastro
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_timezone text := new.raw_user_meta_data ->> 'timezone';
  v_name text := coalesce(
    nullif(new.raw_user_meta_data ->> 'name', ''),
    nullif(new.raw_user_meta_data ->> 'display_name', ''),
    'Membro'
  );
begin
  if v_timezone is null
    or not exists (select 1 from pg_catalog.pg_timezone_names z where z.name = v_timezone) then
    v_timezone := 'America/Sao_Paulo';
  end if;

  insert into public.profiles (id, display_name, timezone)
  values (new.id, v_name, v_timezone);
  return new;
end $$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Admin (RN07): criada antes de qualquer policy que a use
create function public.is_admin() returns boolean
language sql stable set search_path = ''
as $$ select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin' $$;

-- Perfume do Dia (RN06)
create function public.set_daily_perfume(p_perfume_id uuid)
returns public.daily_perfumes
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_date date;
  v_row public.daily_perfumes;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  select (now() at time zone p.timezone)::date into v_date
    from public.profiles p where p.id = v_uid;
  insert into public.daily_perfumes (user_id, perfume_id, date)
    values (v_uid, p_perfume_id, v_date)
  on conflict (user_id, date) do update set perfume_id = excluded.perfume_id
  returning * into v_row;
  return v_row;
end $$;
