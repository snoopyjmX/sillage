# Arquitetura

## Dependências

| Dependência      | Tipo | O que resolve                                                                                       | Por que o que já existe não resolve                                                                         |
| ---------------- | ---- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `supabase` (CLI) | dev  | Sobe o Supabase local (Docker), aplica migrations/seed e roda os testes pgTAP (`supabase test db`). | O SDK `@supabase/supabase-js` só fala com um projeto já existente; não gerencia banco local nem migrations. |
