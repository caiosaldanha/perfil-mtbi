'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';

interface Question {
  id: number;
  text: string;
  dimension: string;
  trait_high: string;
  trait_low: string;
}

interface AnsweredItem {
  question_id: number;
  answer: number;
  dimension: string;
}

type SessionStatus = 'in_progress' | 'completed' | 'cancelled';

interface SessionState {
  id: number;
  user_id: number;
  status: SessionStatus;
  current_index: number;
  total_questions: number;
  answers_count: number;
  question: Question | null;
  answered: AnsweredItem[];
  personality_type?: string;
  trait_scores?: Record<string, number> | null;
  completed_at?: string | null;
  test_result_id?: number | null;
}

const likertOptions = [
  { value: 1, label: 'Discordo totalmente' },
  { value: 2, label: 'Discordo parcialmente' },
  { value: 3, label: 'Neutro' },
  { value: 4, label: 'Concordo parcialmente' },
  { value: 5, label: 'Concordo totalmente' },
];

const traitLabels: Record<string, string> = {
  E: 'Extroversão',
  I: 'Introversão',
  S: 'Sensação',
  N: 'Intuição',
  T: 'Pensamento',
  F: 'Sentimento',
  J: 'Julgamento',
  P: 'Percepção',
};

const traitAffirmations: Record<string, string> = {
  E: 'Sua energia cresce com as conexões que você cria!',
  I: 'Momentos de introspecção ajudam você a recarregar.',
  S: 'Você valoriza fatos concretos e o que é palpável.',
  N: 'Sua imaginação abre caminhos para novas possibilidades.',
  T: 'A lógica é um dos seus superpoderes nas decisões.',
  F: 'Você considera o impacto humano em cada escolha.',
  J: 'Organização e clareza deixam seu caminho mais leve.',
  P: 'Flexibilidade e espontaneidade fazem parte do seu estilo.',
};

const dimensionNames: Record<string, string> = {
  'E/I': 'Energia',
  'S/N': 'Percepção',
  'T/F': 'Decisão',
  'J/P': 'Estilo de vida',
};

const traitPairs = [
  { primary: 'E', secondary: 'I', label: 'Energia' },
  { primary: 'S', secondary: 'N', label: 'Percepção' },
  { primary: 'T', secondary: 'F', label: 'Decisão' },
  { primary: 'J', secondary: 'P', label: 'Estilo de vida' },
];

const formatDate = (value?: string | null) => {
  if (!value) return '';
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

function buildFeedback(question: Question | null, answerValue: number | null): string | null {
  if (!question || answerValue == null) {
    return null;
  }

  if (answerValue >= 4) {
    return traitAffirmations[question.trait_high] ?? null;
  }

  if (answerValue <= 2) {
    return traitAffirmations[question.trait_low] ?? null;
  }

  return 'Você manteve um equilíbrio nessa dimensão — continue explorando!';
}

function TestPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [session, setSession] = useState<SessionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedValue, setSelectedValue] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const answeredCount = session?.answers_count ?? 0;
  const totalQuestions = session?.total_questions ?? 0;
  const progress = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  const traitProgress = useMemo(() => {
    if (!session?.trait_scores) {
      return traitPairs.map((pair) => ({ ...pair, primaryPercentage: 50, secondaryPercentage: 50 }));
    }

    return traitPairs.map((pair) => {
      const primaryScore = session.trait_scores?.[pair.primary] ?? 0;
      const secondaryScore = session.trait_scores?.[pair.secondary] ?? 0;
      const total = primaryScore + secondaryScore;
      const primaryPercentage = total > 0 ? Math.round((primaryScore / total) * 100) : 50;
      const secondaryPercentage = 100 - primaryPercentage;
      return { ...pair, primaryPercentage, secondaryPercentage };
    });
  }, [session?.trait_scores]);

  const startSession = async (restart = false) => {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      router.push('/register');
      return;
    }

    setLoading(true);
    setError('');
    setFeedback(null);

    try {
      const response = await fetch('/api/test-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: Number(userId), restart }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Não foi possível iniciar o teste.');
        return;
      }

      const data: SessionState = await response.json();
      setSession(data);
      setSelectedValue(null);
      setStreak(data.answers_count);
      setLoading(false);
    } catch {
      setError('Não foi possível conectar ao servidor. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const restart = searchParams.get('restart') === 'true';
    startSession(restart);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (session?.status === 'completed' && session.personality_type) {
      localStorage.setItem('personality_type', session.personality_type);
      if (session.trait_scores) {
        localStorage.setItem('trait_scores', JSON.stringify(session.trait_scores));
      }
      const timeout = setTimeout(() => router.push('/results'), 800);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [session, router]);

  const handleSubmitAnswer = async () => {
    if (!session || !session.question || selectedValue == null) {
      return;
    }

    const currentQuestion = session.question;
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/test-session/${session.id}/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question_id: currentQuestion.id,
          answer: selectedValue,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Não foi possível registrar a resposta.');
        return;
      }

      const updatedSession: SessionState = await response.json();
      setSession(updatedSession);
      setSelectedValue(null);
      setStreak(updatedSession.answers_count);
      const message = buildFeedback(currentQuestion, selectedValue);
      setFeedback(message);
    } catch {
      setError('Não foi possível enviar sua resposta. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRewind = async () => {
    if (!session) return;

    try {
      const response = await fetch(`/api/test-session/${session.id}/rewind`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Não foi possível voltar a pergunta anterior.');
        return;
      }

      const updatedSession: SessionState = await response.json();
      setSession(updatedSession);
      setSelectedValue(null);
      setStreak(updatedSession.answers_count);
      setFeedback(null);
    } catch {
      setError('Não foi possível voltar a pergunta.');
    }
  };

  const handleRestart = () => {
    setStreak(0);
    startSession(true);
  };

  const handleGoToResults = () => {
    localStorage.setItem('personality_type', session?.personality_type ?? '');
    if (session?.trait_scores) {
      localStorage.setItem('trait_scores', JSON.stringify(session.trait_scores));
    }
    router.push('/results');
  };

  const renderCompletedCard = () => (
    <div className="rounded-2xl bg-white p-8 text-center shadow-xl">
      <h2 className="text-3xl font-bold text-gray-900">Você já concluiu este teste</h2>
      <p className="mt-3 text-gray-600">
        Resultado atual: <span className="font-semibold text-blue-600">{session?.personality_type}</span>
      </p>
      <p className="text-sm text-gray-500">Concluído em {formatDate(session?.completed_at)}</p>
      <div className="mt-6 flex flex-col gap-4 md:flex-row md:justify-center">
        <button
          className="rounded-full bg-blue-600 px-6 py-3 font-semibold text-white shadow hover:bg-blue-700"
          onClick={handleGoToResults}
        >
          Ver detalhes do resultado
        </button>
        <button
          className="rounded-full border border-blue-600 px-6 py-3 font-semibold text-blue-600 hover:bg-blue-50"
          onClick={handleRestart}
        >
          Refazer teste agora
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-gray-50">
          <p className="text-gray-600">Carregando perguntas...</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="flex min-h-[calc(100vh-80px)] flex-col items-center bg-gray-50 py-10 px-4">
        <div className="w-full max-w-4xl space-y-8">
          <header className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">Teste de Personalidade</h1>
            <p className="mt-2 text-gray-700">
              Concentre-se em cada pergunta e acompanhe sua jornada de autoconhecimento.
            </p>
          </header>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {error}
            </div>
          )}

          {session?.status === 'completed' && !session.question ? (
            renderCompletedCard()
          ) : (
            <>
              <section className="rounded-2xl bg-white p-6 shadow">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Progresso</p>
                    <p className="text-xl font-bold text-gray-900">
                      Pergunta {answeredCount + 1} de {totalQuestions}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Combo de foco</span>
                    <span className="rounded-full bg-blue-100 px-4 py-1 text-blue-700">x{streak}</span>
                  </div>
                </div>

                <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-gray-200" aria-hidden>
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>

                {session?.question ? (
                  <div className="mt-6 space-y-6">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                        Dimensão {dimensionNames[session.question.dimension] ?? session.question.dimension}
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold text-gray-900 md:text-3xl">
                        {session.question.text}
                      </h2>
                    </div>

                    <div className="grid gap-3 md:grid-cols-5">
                      {likertOptions.map(({ value, label }) => {
                        const isSelected = selectedValue === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setSelectedValue(value)}
                            className={`flex flex-col items-center rounded-xl border px-4 py-4 text-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50 text-blue-700 shadow'
                                : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-600'
                            }`}
                          >
                            <span className="text-lg font-bold">{value}</span>
                            <span className="mt-2 text-xs md:text-sm">{label}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex flex-col gap-3 md:flex-row md:justify-between">
                      <div className="text-sm text-gray-600">
                        <p>Escolha a alternativa que melhor representa você neste momento.</p>
                      </div>
                      <div className="flex flex-col gap-3 md:flex-row">
                        <button
                          type="button"
                          onClick={handleRewind}
                          disabled={session.answered.length === 0 || isSubmitting}
                          className="rounded-full border border-blue-600 px-6 py-2 font-semibold text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400"
                        >
                          Voltar
                        </button>
                        <button
                          type="button"
                          onClick={handleSubmitAnswer}
                          disabled={selectedValue == null || isSubmitting}
                          className="rounded-full bg-blue-600 px-8 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                        >
                          {isSubmitting ? 'Enviando...' : 'Confirmar resposta'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 text-center">
                    <p className="text-lg text-gray-700">Carregando próxima pergunta...</p>
                  </div>
                )}
              </section>

              {feedback && (
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 text-blue-800 shadow-sm">
                  <p className="text-sm font-semibold uppercase tracking-wide">Insight desbloqueado</p>
                  <p className="mt-2 text-base">{feedback}</p>
                </div>
              )}

              <section className="rounded-2xl bg-white p-6 shadow">
                <h3 className="text-lg font-semibold text-gray-900">Mapa de progresso por dimensão</h3>
                <p className="text-sm text-gray-500">
                  Veja como suas respostas estão distribuídas entre os pares de traços.
                </p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {traitProgress.map((item) => (
                    <div key={item.label} className="rounded-xl border border-gray-200 p-4">
                      <div className="flex items-center justify-between text-sm font-semibold text-gray-700">
                        <span>{traitLabels[item.primary]}</span>
                        <span className="text-xs uppercase tracking-wide text-gray-500">{item.label}</span>
                        <span>{traitLabels[item.secondary]}</span>
                      </div>
                      <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-gray-200" aria-hidden>
                        <div
                          className="h-full rounded-full bg-blue-600 transition-all"
                          style={{ width: `${item.primaryPercentage}%` }}
                        ></div>
                      </div>
                      <div className="mt-2 flex justify-between text-xs text-gray-500">
                        <span>{item.primaryPercentage}%</span>
                        <span>{item.secondaryPercentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </>
  );
}

export default function Test() {
  return (
    <Suspense
      fallback={
        <>
          <Navbar />
          <main className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-gray-50 px-4">
            <p className="text-gray-600">Carregando teste...</p>
          </main>
        </>
      }
    >
      <TestPageContent />
    </Suspense>
  );
}
