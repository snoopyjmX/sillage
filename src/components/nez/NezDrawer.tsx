import { Sparkles } from 'lucide-react';
import { useId, useState, type FormEvent } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { NezFab } from './NezFab';
import { AsyncBoundary } from '@/components/ui/async-boundary';
import { Skeleton } from '@/components/ui/skeleton';
import { SubmitButton } from '@/components/ui/submit-button';
import { Textarea } from '@/components/ui/textarea';
import { TypingAnimation } from '@/components/ui/typing-animation';
import { getErrorMessage } from '@/constants/errors';
import { useAskNez, useNez } from '@/hooks/useNez';
import { NEZ_QUESTION_MAX } from '@/lib/nez';

const TYPING_SPEED_MS = 18;

function NezLoading() {
  return (
    <div role="status" aria-label="O Nez está pensando" className="flex flex-col gap-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-11/12" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

// Drawer lateral do Nez: pergunta (com o perfume em foco como contexto) e resposta digitada.
export function NezDrawer() {
  const { open, setOpen, perfumeContext } = useNez();
  const ask = useAskNez();
  const [question, setQuestion] = useState('');
  const [asked, setAsked] = useState('');
  const inputId = useId();
  const trimmed = question.trim();

  const send = (text: string) => {
    setAsked(text);
    ask.mutate({ question: text, context: perfumeContext ?? undefined });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (trimmed === '' || ask.isPending) return;
    send(trimmed);
    setQuestion('');
  };

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
            {perfumeContext
              ? 'Pergunte sobre o perfume que você está vendo.'
              : 'Conte o que você procura e o Nez sugere o caminho olfativo.'}
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4" aria-live="polite">
          {ask.status === 'idle' ? (
            <p className="text-sm text-text-secondary">
              Experimente: “Que perfume combina com uma noite fria?” ou “O que há de amadeirado por
              aqui?”
            </p>
          ) : (
            <>
              <p className="self-end rounded-xl bg-accent px-3 py-2 text-sm text-accent-foreground">
                {asked}
              </p>
              <AsyncBoundary
                status={ask.status === 'pending' ? 'pending' : ask.status}
                loading={<NezLoading />}
                onRetry={() => send(asked)}
                errorTitle="O Nez não respondeu"
                errorDescription={getErrorMessage(ask.error)}
                offlineDescription="Conecte-se à internet para falar com o Nez."
              >
                {ask.data && (
                  <TypingAnimation
                    as="p"
                    speed={TYPING_SPEED_MS}
                    className="font-heading text-lg leading-relaxed whitespace-pre-line"
                  >
                    {ask.data}
                  </TypingAnimation>
                )}
              </AsyncBoundary>
            </>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
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
