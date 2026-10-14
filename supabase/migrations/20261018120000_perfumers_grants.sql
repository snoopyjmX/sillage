-- Os grants das tabelas novas não vêm do padrão do Supabase em produção (só o ambiente local tem
-- privilégios padrão). Sem isso, anon e authenticated recebem 42501 ao ler perfumistas.
-- Leitura pública. A escrita também recebe grant para authenticated, mas a RLS de admin (is_admin)
-- continua sendo a barreira: usuário comum recebe 0 linhas afetadas, não acesso.
grant select on public.perfumers, public.perfume_perfumers to anon, authenticated;
grant insert, update, delete on public.perfumers, public.perfume_perfumers to authenticated;
