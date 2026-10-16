import { Compass, Sparkles } from 'lucide-react';
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { NezDiscovery } from './NezDiscovery';
import { NezFab } from './NezFab';
import { AsyncBoundary } from '@/components/ui/async-boundary';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SubmitButton } from '@/components/ui/submit-button';
import { Textarea } from '@/components/ui/textarea';
import { TypingAnimation } from '@/components/ui/typing-animation';
import { getErrorMessage } from '@/constants/errors';
import { useAskNez, useNez } from '@/hooks/useNez';
import type { NezMessage } from '@/services/aiService';
import { NEZ_QUESTION_MAX } from '@/lib/nez';

const TYPING_SPEED_MS = 18;
// O servidor só usa as últimas mensagens; não vale mandar mais que isso
const HISTORY_SENT = 6;

interface ChatMessage extends NezMessage {
  id: string;
}

const SUGGESTIONS = ['Que perfume combina com uma noite fria?', 'O que há de amadeirado por aqui?'];

function NezLoading() {
  return (
    <div role="status" aria-label="O Nez está pensando" className="flex flex-col gap-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-11/12" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

// Drawer lateral do Nez: conversa da sessão (perguntas e respostas), com o perfume em foco como
// contexto. Só a resposta mais recente é digitada; as anteriores aparecem prontas.
export function NezDrawer() {
  const { open, setOpen, perfumeContext, draft } = useNez();
  const ask = useAskNez();
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // Pergunta que ainda não foi respondida (em andamento ou com erro), para "Tentar novamente"
  const [pending, setPending] = useState<string | null>(null);
  // 'discovery': trilha guiada no lugar da conversa
  const [view, setView] = useState<'chat' | 'discovery'>('chat');
  const nextId = useRef(0);
  const scroller = useRef<HTMLDivElement>(null);
  const inputId = useId();
  // Rascunho já aplicado ao campo. Ajuste de estado durante a renderização, sem efeito: um
  // rascunho novo ("Perguntar ao Nez") vai para o campo para o usuário revisar; nunca é enviado.
  const [appliedDraft, setAppliedDraft] = useState(draft);
  if (draft !== appliedDraft) {
    setAppliedDraft(draft);
    if (draft !== null) {
      setQuestion(draft.text);
      setView('chat');
    }
  }
  const trimmed = question.trim();

  const newMessage = (role: NezMessage['role'], text: string): ChatMessage => ({
    id: `m${nextId.current++}`,
    role,
    text,
  });

  // `pending` só vira mensagem quando a resposta chega: o histórico enviado nunca tem pergunta
  // sem resposta, e um erro não deixa mensagens órfãs.
  const send = (text: string) => {
    setPending(text);
    ask.mutate(
      {
        question: text,
        context: perfumeContext ?? undefined,
        history: messages
          .slice(-HISTORY_SENT)
          .map(({ role, text: body }) => ({ role, text: body })),
      },
      {
        onSuccess: (answer) => {
          setMessages((current) => [
            ...current,
            newMessage('user', text),
            newMessage('assistant', answer),
          ]);
          setPending(null);
        },
      }
    );
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (trimmed === '' || ask.isPending) return;
    send(trimmed);
    setQuestion('');
  };

  // Auto-scroll até o fim quando entra pergunta, carregamento ou resposta. O espaço da resposta
  // digitada já é reservado, então um scroll por mudança basta.
  useEffect(() => {
    const element = scroller.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [messages.length, pending, ask.status, open]);

  const latestAssistantId = messages.findLast((message) => message.role === 'assistant')?.id;
  const empty = messages.length === 0 && pending === null;

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <NezFab />
      <DrawerContent side="right" aria-describedby={undefined}>
        <DrawerHeader className="pt-4">
          <DrawerTitle className="flex items-center gap-2">
            <Sparkles className="size-6 text-primary" aria-hidden />
            Nez, seu Mestre Perfumista
          </DrawerTitle>
          <DrawerDescription>
            {view === 'discovery'
              ? 'Três respostas rápidas e o Nez escolhe perfumes do catálogo para você.'
              : perfumeContext
                ? 'Pergunte sobre o perfume que você está vendo.'
                : 'Conte o que você procura e o Nez sugere o caminho olfativo.'}
          </DrawerDescription>
        </DrawerHeader>

        {view === 'discovery' && (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <NezDiscovery
              onBack={() => setView('chat')}
              onNavigate={() => {
                setView('chat');
                setOpen(false);
              }}
            />
          </div>
        )}

        <div
          ref={scroller}
          hidden={view === 'discovery'}
          role="log"
          aria-label="Conversa com o Nez"
          aria-live="polite"
          className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto"
        >
          {empty && (
            <div className="flex flex-col gap-2 text-sm text-text-secondary">
              <Button variant="outline" onClick={() => setView('discovery')} className="w-full">
                <Compass aria-hidden />
                Guiar minha escolha
              </Button>
              <p>Experimente perguntar:</p>
              <ul className="flex flex-col gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <li key={suggestion}>
                    <button
                      type="button"
                      onClick={() => setQuestion(suggestion)}
                      className="min-h-11 w-full rounded-lg border bg-card px-3 text-left text-foreground outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      {suggestion}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {messages.map((message) =>
            message.role === 'user' ? (
              <p
                key={message.id}
                className="max-w-[85%] self-end rounded-xl bg-accent px-3 py-2 text-sm text-accent-foreground"
              >
                {message.text}
              </p>
            ) : message.id === latestAssistantId ? (
              <TypingAnimation
                key={message.id}
                as="p"
                speed={TYPING_SPEED_MS}
                className="font-heading text-lg leading-relaxed whitespace-pre-line"
              >
                {message.text}
              </TypingAnimation>
            ) : (
              <p
                key={message.id}
                className="font-heading text-lg leading-relaxed whitespace-pre-line"
              >
                {message.text}
              </p>
            )
          )}

          {pending !== null && (
            <>
              <p className="max-w-[85%] self-end rounded-xl bg-accent px-3 py-2 text-sm text-accent-foreground">
                {pending}
              </p>
              <AsyncBoundary
                status={ask.status === 'error' ? 'error' : 'pending'}
                loading={<NezLoading />}
                onRetry={() => send(pending)}
                errorTitle="O Nez não respondeu"
                errorDescription={getErrorMessage(ask.error)}
                offlineDescription="Conecte-se à internet para falar com o Nez."
              >
                {null}
              </AsyncBoundary>
            </>
          )}
        </div>

        <form onSubmit={handleSubmit} hidden={view === 'discovery'} className="flex flex-col gap-2">
          <label htmlFor={inputId} className="text-sm font-medium">
            Sua pergunta ao Nez
          </label>
          <Textarea
            id={inputId}
            value={question}
            maxLength={NEZ_QUESTION_MAX}
            onChange={(event) => setQuestion(event.target.value)}
            className="min-h-20"
          />
          <SubmitButton loading={ask.isPending} loadingLabel="Nez está pensando…">
            Perguntar
          </SubmitButton>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
