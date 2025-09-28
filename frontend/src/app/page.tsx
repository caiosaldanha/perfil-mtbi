'use client';

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <main className="flex flex-col items-center justify-center min-h-screen py-2">
      <div className="text-center px-4">
        <h1 className="text-5xl font-extrabold text-gray-800 mb-4">Descubra-se</h1>
        <p className="text-xl text-gray-600 mb-8">Faça o teste de personalidade MTBI e inicie sua jornada de autoconhecimento.</p>
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-full text-lg transition duration-300 ease-in-out transform hover:scale-105"
          onClick={() => router.push('/register')}
        >
          Comece Agora
        </button>
      </div>

      <div className="mt-20 w-full max-w-4xl px-4">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h3 className="text-3xl font-bold mb-4 text-gray-800">O que é o Teste MTBI?</h3>
          <p className="text-gray-700 mb-4">
            O Indicador de Tipo Myers-Briggs (MBTI) é uma avaliação psicológica que categoriza os tipos de personalidade com base em quatro dimensões principais:
          </p>
          <ul className="list-none space-y-2">
            <li className="flex items-start">
              <span className="text-blue-500 font-bold mr-2">E/I:</span>
              <span><strong>Extraversão (E) vs. Introversão (I):</strong> Como você direciona sua energia.</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 font-bold mr-2">S/N:</span>
              <span><strong>Sensação (S) vs. Intuição (N):</strong> Como você absorve informações.</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 font-bold mr-2">T/F:</span>
              <span><strong>Pensamento (T) vs. Sentimento (F):</strong> Como você toma decisões.</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 font-bold mr-2">J/P:</span>
              <span><strong>Julgamento (J) vs. Percepção (P):</strong> Como você aborda o mundo exterior.</span>
            </li>
          </ul>
          <p className="text-gray-700 mt-4">
            Depois de concluir o teste, você receberá seu tipo de personalidade e poderá conversar com nossa IA para explorar o que isso significa para o seu crescimento pessoal e autoconhecimento.
          </p>
        </div>
      </div>
    </main>
  );
}
