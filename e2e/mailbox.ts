// Caixa de e-mail do Supabase local. A CLI atual sobe o Mailpit (porta 54324), que substituiu o
// Inbucket: a API é /api/v1/search e /api/v1/message/:id, não /api/v1/mailbox/:nome.
const MAIL_URL = process.env.MAIL_URL ?? 'http://127.0.0.1:54324';

interface MailSummary {
  ID: string;
  Subject: string;
}

// Procura a mensagem mais recente para o destinatário; devolve null enquanto não chegou.
export const findLatestMail = async (to: string): Promise<MailSummary | null> => {
  const response = await fetch(`${MAIL_URL}/api/v1/search?query=${encodeURIComponent(`to:${to}`)}`);
  if (!response.ok) return null;
  const body = (await response.json()) as { messages?: MailSummary[] };
  return body.messages?.[0] ?? null;
};

// Primeiro link do HTML que passa pela rota de verificação do Auth (carrega o token).
export const findVerifyLink = async (to: string): Promise<string | null> => {
  const mail = await findLatestMail(to);
  if (!mail) return null;
  const response = await fetch(`${MAIL_URL}/api/v1/message/${mail.ID}`);
  const body = (await response.json()) as { HTML?: string };
  const match = /href="([^"]*\/auth\/v1\/verify[^"]*)"/.exec(body.HTML ?? '');
  return match?.[1]?.replaceAll('&amp;', '&') ?? null;
};
