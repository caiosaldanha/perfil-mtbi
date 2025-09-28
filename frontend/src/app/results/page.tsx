'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const descriptions: { [key: string]: string } = {
  'INTJ': 'O Arquiteto - Pensadores estratégicos e independentes',
  'INTP': 'O Pensador - Inovadores e lógicos solucionadores de problemas',
  'ENTJ': 'O Comandante - Líderes ousados e de vontade forte',
  'ENTP': 'O Debatedor - Pensadores inteligentes e curiosos',
  'INFJ': 'O Advogado - Inspiradores criativos e perspicazes',
  'INFP': 'O Mediador - Idealistas poéticos de bom coração',
  'ENFJ': 'O Protagonista - Líderes carismáticos e inspiradores',
  'ENFP': 'O Ativista - Espíritos livres entusiasmados e criativos',
  'ISTJ': 'O Logístico - Indivíduos práticos e factuais',
  'ISFJ': 'O Protetor - Protetores de coração caloroso e dedicados',
  'ESTJ': 'O Executivo - Excelentes administradores e gerentes',
  'ESFJ': 'O Cônsul - Pessoas extraordinariamente atenciosas e sociais',
  'ISTP': 'O Virtuoso - Experimentadores ousados e práticos',
  'ISFP': 'O Aventureiro - Artistas flexíveis e charmosos',
  'ESTP': 'O Empreendedor - Pessoas inteligentes, enérgicas e perspicazes',
  'ESFP': 'O Animador - Pessoas espontâneas, enérgicas e entusiasmadas'
};

export default function Results() {
  const [personalityType, setPersonalityType] = useState('');
  const [description, setDescription] = useState('');
  const router = useRouter();

  useEffect(() => {
    const userId = localStorage.getItem('user_id');
    const pType = localStorage.getItem('personality_type');

    if (!userId || !pType) {
      router.push('/register');
      return;
    }

    setPersonalityType(pType);
    setDescription(descriptions[pType] || 'Tipo de personalidade desconhecido');
  }, [router]);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen py-12">
      <div className="w-full max-w-3xl px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Seu Resultado</h2>
          <p className="text-gray-600">Parabéns por completar o teste!</p>
        </div>

        <div className="bg-white shadow-lg rounded-lg p-8 text-center">
          <h1 className="text-6xl font-extrabold text-blue-500 mb-2">{personalityType}</h1>
          <h4 className="text-2xl font-semibold text-gray-700 mb-4">{description}</h4>
          <p className="text-gray-600">
            Este é o seu tipo de personalidade. Use esta informação para se conhecer melhor e explorar seus pontos fortes.
          </p>
        </div>

        <div className="mt-8 text-center">
          <p className="text-lg text-gray-700 mb-4">Pronto para o próximo passo?</p>
          <button
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-full text-lg transition duration-300 ease-in-out transform hover:scale-105"
            onClick={() => router.push('/chat')}
          >
            Converse com nossa IA
          </button>
        </div>
      </div>
    </main>
  );
}
