// Passkey (WebAuthn) cadastrada pelo usuário. A chave privada nunca sai do aparelho: aqui só há
// os metadados que o Supabase Auth guarda.
export interface Passkey {
  id: string;
  name: string | null;
  createdAt: string;
  lastUsedAt: string | null;
}
