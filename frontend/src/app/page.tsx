'use client';

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <main className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] py-2">
      <div className="text-center px-4">
        <h1 className="text-6xl font-extrabold text-gray-900 mb-4">Descubra-se</h1>
        <p className="text-2xl text-gray-700 mb-8">Faça o teste de personalidade MTBI e inicie sua jornada de autoconhecimento.</p>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-full text-xl transition duration-300 ease-in-out transform hover:scale-105 shadow-lg"
          onClick={() => router.push('/register')}
        >
          Comece Agora
        </button>
      </div>

      <div className="mt-24 w-full max-w-5xl px-4">
        <div className="bg-white shadow-2xl rounded-xl p-10">
          <h3 className="text-4xl font-bold mb-6 text-gray-900">O que é o Teste MTBI?</h3>
          <p className="text-gray-800 mb-6 text-lg">
            O Indicador de Tipo Myers-Briggs (MBTI) é uma avaliação psicológica que categoriza os tipos de personalidade com base em quatro dimensões principais:
          </p>
          <ul className="list-none space-y-4">
            <li className="flex items-start">
              <span className="text-blue-600 font-bold mr-3 text-xl">E/I:</span>
              <span className="text-lg"><strong>Extraversão (E) vs. Introversão (I):</strong> Como você direciona sua energia.</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 font-bold mr-3 text-xl">S/N:</span>
              <span className="text-lg"><strong>Sensação (S) vs. Intuição (N):</strong> Como você absorve informações.</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 font-bold mr-3 text-xl">T/F:</span>
              <span className="text-lg"><strong>Pensamento (T) vs. Sentimento (F):</strong> Como você toma decisões.</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 font-bold mr-3 text-xl">J/P:</span>
              <span className="text-lg"><strong>Julgamento (J) vs. Percepção (P):</strong> Como você aborda o mundo exterior.</span>
            </li>
          </ul>
          <p className="text-gray-800 mt-6 text-lg">
            Depois de concluir o teste, você receberá seu tipo de personalidade e poderá conversar com nossa IA para explorar o que isso significa para o seu crescimento pessoal e autoconhecimento.
          </p>
        </div>
      </div>
    </main>
  );
}
