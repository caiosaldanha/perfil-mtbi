'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Question {
  id: number;
  text: string;
}

export default function Test() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [error, setError] = useState('');
  const router = useRouter();

  const progress = questions.length > 0 ? (Object.keys(answers).length / questions.length) * 100 : 0;

  useEffect(() => {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      router.push('/register');
      return;
    }

    const fetchQuestions = async () => {
      try {
        const response = await fetch('/api/questions');
        if (response.ok) {
          const data = await response.json();
          setQuestions(data);
        } else {
          setError('Falha ao buscar perguntas');
        }
      } catch {
        setError('Ocorreu um erro inesperado');
      }
    };

    fetchQuestions();
  }, [router]);

  const handleAnswerChange = (questionId: number, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const userId = localStorage.getItem('user_id');
    if (!userId) {
      router.push('/register');
      return;
    }

    if (Object.keys(answers).length !== questions.length) {
      setError('Por favor, responda todas as perguntas');
      return;
    }

    const formattedAnswers = Object.keys(answers).map((questionId) => ({
      question_id: parseInt(questionId),
      answer: answers[parseInt(questionId)],
    }));

    try {
      const response = await fetch('/api/submit-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: parseInt(userId), answers: formattedAnswers }),
      });

      if (response.ok) {
        const result = await response.json();
        localStorage.setItem('personality_type', result.personality_type);
        router.push('/results');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Falha ao enviar o teste');
      }
    } catch {
      setError('Ocorreu um erro inesperado');
    }
  };

  return (
    <main className="flex flex-col items-center min-h-[calc(100vh-80px)] py-12 px-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-gray-900">Teste de Personalidade</h2>
          <p className="text-gray-700 mt-2">Responda honestamente para obter o resultado mais preciso.</p>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-4 mb-8 overflow-hidden">
          <div className="bg-blue-600 h-4 rounded-full transition-all duration-500 ease-in-out" style={{ width: `${progress}%` }}></div>
        </div>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-8">
          {questions.map((question, index) => (
            <div key={question.id} className="bg-white shadow-2xl rounded-xl p-8">
              <h6 className="font-semibold text-xl text-gray-900 mb-4">Questão {index + 1}</h6>
              <p className="text-gray-800 text-lg mb-6">{question.text}</p>

              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Discordo</span>
                <div className="flex space-x-6">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <label key={value} className="flex flex-col items-center space-y-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`question_${question.id}`}
                        value={value}
                        onChange={() => handleAnswerChange(question.id, value)}
                        className="form-radio h-6 w-6 text-blue-600 focus:ring-blue-600 border-gray-300"
                        required
                      />
                      <span className="text-gray-800 font-semibold">{value}</span>
                    </label>
                  ))}
                </div>
                <span className="text-gray-600 font-medium">Concordo</span>
              </div>
            </div>
          ))}

          <div className="text-center pt-4">
            <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-10 rounded-lg transition duration-300 ease-in-out shadow-lg">
              Finalizar Teste
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
