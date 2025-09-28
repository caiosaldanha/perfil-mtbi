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

export default function Results() {
  const [personalityType, setPersonalityType] = useState('');
  const [description, setDescription] = useState('');
  const [traitScores, setTraitScores] = useState<Record<string, number>>({});
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
  }, [router]);

  const traitPairs = useMemo(
    () => [
      { primary: 'E', secondary: 'I', label: 'Energia' },
      { primary: 'S', secondary: 'N', label: 'Percepção' },
      { primary: 'T', secondary: 'F', label: 'Decisão' },
      { primary: 'J', secondary: 'P', label: 'Estilo de vida' },
    ],
    [],
  );

  return (
    <>
      <Navbar />
      <main className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] bg-gray-50 py-12 px-4">
        <div className="w-full max-w-3xl">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 md:text-4xl">Seu Resultado</h2>
            <p className="text-gray-700 mt-2">Parabéns por concluir o teste! Aqui está seu panorama.</p>
          </div>

          <section className="rounded-2xl bg-white p-10 text-center shadow-xl">
            <h1 className="text-5xl font-extrabold text-blue-600 md:text-6xl">{personalityType}</h1>
            <h4 className="mt-4 text-2xl font-semibold text-gray-800 md:text-3xl">{description}</h4>
            <p className="mt-4 text-base text-gray-700">
              Utilize este diagnóstico como ponto de partida para aprofundar seu autoconhecimento e planejar próximos passos na sua carreira.
            </p>
          </section>

          {Object.keys(traitScores).length > 0 && (
            <section className="mt-10">
              <h3 className="text-xl font-semibold text-gray-900">Como seu perfil se distribui</h3>
              <p className="text-sm text-gray-600">Percentuais calculados a partir das suas respostas.</p>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {traitPairs.map(({ primary, secondary, label }) => {
                  const primaryScore = traitScores[primary] ?? 0;
                  const secondaryScore = traitScores[secondary] ?? 0;
                  const total = primaryScore + secondaryScore || 1;
                  const primaryPercentage = Math.round((primaryScore / total) * 100);
                  const secondaryPercentage = 100 - primaryPercentage;

                  return (
                    <div key={label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                      <div className="flex items-center justify-between text-sm font-semibold text-gray-700">
                        <span>{primary}</span>
                        <span className="text-xs uppercase tracking-wide text-gray-500">{label}</span>
                        <span>{secondary}</span>
                      </div>
                      <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-gray-200" aria-hidden>
                        <div
                          className="h-full rounded-full bg-blue-600 transition-all"
                          style={{ width: `${primaryPercentage}%` }}
                        ></div>
                      </div>
                      <div className="mt-2 flex justify-between text-xs text-gray-600">
                        <span>{primaryPercentage}%</span>
                        <span>{secondaryPercentage}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <div className="mt-10 text-center">
            <p className="text-xl text-gray-800 mb-4">Pronto para o próximo passo?</p>
            <button
              className="rounded-full bg-blue-600 px-8 py-3 text-xl font-semibold text-white shadow-lg transition duration-300 hover:bg-blue-700"
              onClick={() => router.push('/chat')}
            >
              Converse com nossa IA
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
