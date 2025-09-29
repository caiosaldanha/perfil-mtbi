'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

const descriptions: Record<string, string> = {
  INTJ: 'O Arquiteto - Pensadores estratégicos e independentes.',
  INTP: 'O Pensador - Inovadores e lógicos solucionadores de problemas.',
  ENTJ: 'O Comandante - Líderes ousados e de vontade forte.',
  ENTP: 'O Debatedor - Pensadores inteligentes e curiosos.',
  INFJ: 'O Advogado - Inspiradores criativos e perspicazes.',
  INFP: 'O Mediador - Idealistas poéticos de bom coração.',
  ENFJ: 'O Protagonista - Líderes carismáticos e inspiradores.',
  ENFP: 'O Ativista - Espíritos livres entusiasmados e criativos.',
  ISTJ: 'O Logístico - Indivíduos práticos e factuais.',
  ISFJ: 'O Protetor - Protetores de coração caloroso e dedicados.',
  ESTJ: 'O Executivo - Excelentes administradores e gerentes.',
  ESFJ: 'O Cônsul - Pessoas extraordinariamente atenciosas e sociais.',
  ISTP: 'O Virtuoso - Experimentadores ousados e práticos.',
  ISFP: 'O Aventureiro - Artistas flexíveis e charmosos.',
  ESTP: 'O Empreendedor - Pessoas inteligentes, enérgicas e perspicazes.',
  ESFP: 'O Animador - Pessoas espontâneas, enérgicas e entusiasmadas.',
};

interface TestResultHistory {
  id: number;
  personality_type: string;
  completed_at: string;
}

const traitPairs = [
  { primary: 'E', secondary: 'I', label: 'Energia' },
  { primary: 'S', secondary: 'N', label: 'Percepção' },
  { primary: 'T', secondary: 'F', label: 'Decisão' },
  { primary: 'J', secondary: 'P', label: 'Estilo de vida' },
];

const traitTitles: Record<string, string> = {
  E: 'Extroversão',
  I: 'Introversão',
  S: 'Sensação',
  N: 'Intuição',
  T: 'Pensamento',
  F: 'Sentimento',
  J: 'Julgamento',
  P: 'Percepção',
};

export default function Results() {
  const [personalityType, setPersonalityType] = useState('');
  const [description, setDescription] = useState('');
  const [traitScores, setTraitScores] = useState<Record<string, number>>({});
  const [history, setHistory] = useState<TestResultHistory[]>([]);
  const [historyError, setHistoryError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const userId = localStorage.getItem('user_id');
    const pType = localStorage.getItem('personality_type');
    const storedScores = localStorage.getItem('trait_scores');

    if (!userId || !pType) {
      router.push('/register');
      return;
    }

    setPersonalityType(pType);
    setDescription(descriptions[pType] || 'Tipo de personalidade desconhecido.');

    if (storedScores) {
      try {
        setTraitScores(JSON.parse(storedScores));
      } catch {
        setTraitScores({});
      }
    }

    const fetchHistory = async () => {
      try {
        const response = await fetch(`/api/test-results/${userId}`);
        if (!response.ok) {
          const errorData = await response.json();
          setHistoryError(errorData.error || 'Não foi possível carregar o histórico do teste.');
          return;
        }
        const data: TestResultHistory[] = await response.json();
        setHistory(data);
      } catch {
        setHistoryError('Não foi possível carregar o histórico do teste.');
      }
    };

    fetchHistory();
  }, [router]);

  const traitDistribution = useMemo(() => {
    if (Object.keys(traitScores).length === 0) {
      return traitPairs.map((pair) => ({
        ...pair,
        primaryPercentage: 50,
        secondaryPercentage: 50,
      }));
    }

    return traitPairs.map((pair) => {
      const primaryScore = traitScores[pair.primary] ?? 0;
      const secondaryScore = traitScores[pair.secondary] ?? 0;
      const total = primaryScore + secondaryScore;
      const primaryPercentage = total > 0 ? Math.round((primaryScore / total) * 100) : 50;
      const secondaryPercentage = 100 - primaryPercentage;
      return {
        ...pair,
        primaryPercentage,
        secondaryPercentage,
      };
    });
  }, [traitScores]);

  const handleRetake = () => {
    router.push('/test?restart=true');
  };

  const formatDate = (value: string) => new Date(value).toLocaleString('pt-BR');

  return (
    <>
      <Navbar />
      <main className="flex flex-col items-center justify-start min-h-[calc(100vh-80px)] bg-gray-50 py-12 px-4">
        <div className="w-full max-w-4xl space-y-10">
          <header className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 md:text-4xl">Seu Resultado</h2>
            <p className="mt-2 text-gray-700">Parabéns por concluir o teste! Aqui está o panorama do seu perfil.</p>
          </header>

          <section className="rounded-2xl bg-white p-10 text-center shadow-xl">
            <h1 className="text-5xl font-extrabold text-blue-600 md:text-6xl">{personalityType}</h1>
            <h4 className="mt-4 text-2xl font-semibold text-gray-800 md:text-3xl">{description}</h4>
            <p className="mt-4 text-base text-gray-700">
              Utilize este diagnóstico como ponto de partida para aprofundar seu autoconhecimento e planejar próximos passos na carreira.
            </p>
            <div className="mt-6 flex flex-col gap-3 md:flex-row md:justify-center">
              <button
                onClick={() => router.push('/chat')}
                className="rounded-full bg-blue-600 px-8 py-3 text-white shadow-lg transition hover:bg-blue-700"
              >
                Conversar com a IA
              </button>
              <button
                onClick={handleRetake}
                className="rounded-full border border-blue-600 px-8 py-3 text-blue-600 transition hover:bg-blue-50"
              >
                Refazer o teste
              </button>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow">
            <h3 className="text-xl font-semibold text-gray-900">Distribuição por dimensão</h3>
            <p className="text-sm text-gray-600">Acompanhe como suas respostas se distribuem entre os pares de traços.</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {traitDistribution.map((item) => (
                <div key={item.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between text-sm font-semibold text-gray-700">
                    <span>{traitTitles[item.primary]}</span>
                    <span className="text-xs uppercase tracking-wide text-gray-500">{item.label}</span>
                    <span>{traitTitles[item.secondary]}</span>
                  </div>
                  <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-gray-200" aria-hidden>
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all"
                      style={{ width: `${item.primaryPercentage}%` }}
                    ></div>
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-gray-600">
                    <span>{item.primaryPercentage}%</span>
                    <span>{item.secondaryPercentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Histórico de resultados</h3>
              {history.length > 0 && (
                <span className="text-sm text-gray-500">{history.length} teste(s) registrados</span>
              )}
            </div>
            {historyError && <p className="mt-3 text-sm text-red-600">{historyError}</p>}
            {history.length === 0 && !historyError ? (
              <p className="mt-3 text-sm text-gray-600">Você ainda não possui outros testes registrados.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {history.map((result) => (
                  <li
                    key={result.id}
                    className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{result.personality_type}</p>
                      <p className="text-xs text-gray-500">Concluído em {formatDate(result.completed_at)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
