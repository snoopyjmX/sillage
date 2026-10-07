-- RN06: o Perfume do Dia precisa estar na coleção do usuário com status 'owned' ("Tenho")
create or replace function public.set_daily_perfume(p_perfume_id uuid)
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
  if not exists (
    select 1 from public.collection_items ci
    where ci.user_id = v_uid and ci.perfume_id = p_perfume_id and ci.status = 'owned'
  ) then
    raise exception 'perfume not owned' using errcode = '42501';
  end if;
  select (now() at time zone p.timezone)::date into v_date
    from public.profiles p where p.id = v_uid;
  insert into public.daily_perfumes (user_id, perfume_id, date)
    values (v_uid, p_perfume_id, v_date)
  on conflict (user_id, date) do update set perfume_id = excluded.perfume_id
  returning * into v_row;
  return v_row;
end $$;

revoke all on function public.set_daily_perfume(uuid) from anon, public;
grant execute on function public.set_daily_perfume(uuid) to authenticated;
