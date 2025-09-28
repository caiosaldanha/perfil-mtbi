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

  const progress = (Object.keys(answers).length / questions.length) * 100;

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
    <main className="flex flex-col items-center justify-center min-h-screen py-12">
      <div className="w-full max-w-3xl px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Teste de Personalidade</h2>
          <p className="text-gray-600">Responda honestamente para obter o resultado mais preciso.</p>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-8">
          <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
        </div>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {questions.map((question, index) => (
            <div key={question.id} className="bg-white shadow-lg rounded-lg p-6">
              <h6 className="font-bold text-lg text-gray-800 mb-4">Questão {index + 1}</h6>
              <p className="text-gray-700 mb-4">{question.text}</p>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Discordo</span>
                <div className="flex space-x-4">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <label key={value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`question_${question.id}`}
                        value={value}
                        onChange={() => handleAnswerChange(question.id, value)}
                        className="form-radio h-5 w-5 text-blue-500 focus:ring-blue-500"
                        required
                      />
                      <span className="text-gray-700">{value}</span>
                    </label>
                  ))}
                </div>
                <span className="text-sm text-gray-600">Concordo</span>
              </div>
            </div>
          ))}

          <div className="text-center">
            <button type="submit" className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-lg transition duration-300 ease-in-out">
              Finalizar Teste
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
