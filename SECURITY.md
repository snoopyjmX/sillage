# Política de segurança

O Sillage é um projeto de portfólio. Este arquivo é o resumo; a documentação completa (RLS, modelo de ameaça, riscos aceitos) está em [`docs/SECURITY.md`](docs/SECURITY.md), que é a fonte da verdade.

## Como reportar uma vulnerabilidade

Use o [relato privado de vulnerabilidades do GitHub](https://github.com/snoopyjmX/sillage/security/advisories/new) (aba **Security** do repositório). Não abra uma issue pública com detalhes de exploração.

Inclua o que você encontrou, os passos para reproduzir e o impacto que enxerga. É um projeto mantido por uma pessoa só: a resposta pode levar alguns dias.

## Arquitetura de segurança em resumo

- **Autorização no banco.** A RLS do Postgres (Supabase) é a barreira de acesso: dados privados só aparecem para o dono, e o papel de admin vem de `app_metadata`, nunca de `user_metadata`. A interface apenas reflete o que o banco permite. As policies têm testes pgTAP.
- **Frontend sem segredos.** Só `VITE_SUPABASE_URL` e a `anon key` (pública por desenho) vão ao navegador. `service_role` e a chave do Gemini ficam fora do front.
- **Erros sem vazamento.** Nenhuma mensagem crua do Supabase chega ao usuário; tudo passa por códigos estáveis.
- **Entrada do usuário.** Comentários são renderizados como texto (nunca HTML), `?redirect=` só aceita caminhos internos e as respostas de APIs externas são validadas com Zod.
- **Cabeçalhos HTTP.** CSP sem `unsafe-inline` em scripts, `frame-ancestors 'none'`, `nosniff`, `Referrer-Policy` e `Permissions-Policy` (ver `vercel.json`).
- **IA (Nez).** A chamada passa por uma Edge Function que exige sessão válida e limita o tamanho da entrada.

## Riscos conhecidos e aceitos

Aceitos conscientemente para o escopo de portfólio (detalhes e mitigações em [`docs/SECURITY.md`](docs/SECURITY.md)):

- **Sem rate limit no Nez:** um usuário logado pode consumir a cota do Gemini. O impacto é custo e disponibilidade, não dados.
- **Confirmação de e-mail desativada:** o e-mail não prova identidade; a autorização nunca depende dele.
- **`style-src 'unsafe-inline'` na CSP:** exigido por estilos inline da biblioteca de animação.
- **Catálogo legível com a `anon key`:** o gate de acesso da interface é UX; a leitura pública do catálogo é decisão de produto.
