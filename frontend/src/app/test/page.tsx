'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

interface Question {
  id: number;
  text: string;
  dimension: string;
}

export default function Test() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const answeredCount = Object.keys(answers).length;
  const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  const likertOptions = useMemo(
    () => [
      { value: 1, label: 'Discordo totalmente' },
      { value: 2, label: 'Discordo parcialmente' },
      { value: 3, label: 'Neutro' },
      { value: 4, label: 'Concordo parcialmente' },
      { value: 5, label: 'Concordo totalmente' },
    ],
    [],
  );

  useEffect(() => {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      router.push('/register');
      return;
    }

    const fetchQuestions = async () => {
      try {
        const response = await fetch('/api/questions', { cache: 'no-store' });
        if (!response.ok) {
          setError('Falha ao buscar perguntas');
          return;
        }

        const data: Question[] = await response.json();
        setQuestions(data);
      } catch {
        setError('Ocorreu um erro inesperado ao carregar o teste');
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

    if (answeredCount !== questions.length) {
      setError('Por favor, responda todas as perguntas antes de finalizar.');
      return;
    }

    const formattedAnswers = Object.keys(answers).map((questionId) => ({
      question_id: Number(questionId),
      answer: answers[Number(questionId)],
    }));

    try {
      setIsSubmitting(true);
      const response = await fetch('/api/submit-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: Number(userId), answers: formattedAnswers }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Falha ao enviar o teste');
        return;
      }

      const result = await response.json();
      localStorage.setItem('personality_type', result.personality_type);
      if (result.trait_scores) {
        localStorage.setItem('trait_scores', JSON.stringify(result.trait_scores));
      }
      router.push('/results');
    } catch {
      setError('Ocorreu um erro inesperado ao enviar suas respostas.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="flex flex-col items-center min-h-[calc(100vh-80px)] bg-gray-50 py-10 px-4">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 md:text-4xl">Teste de Personalidade</h2>
            <p className="text-gray-700 mt-2">Responda com sinceridade para receber um retrato fiel do seu perfil.</p>
            <p className="text-sm text-gray-500 mt-1">
              {answeredCount}/{questions.length} perguntas respondidas
            </p>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3 mb-8 overflow-hidden" aria-hidden>
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-in-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          {error && (
            <div
              className="mb-6 rounded-lg border border-red-300 bg-red-100 px-4 py-3 text-sm text-red-800"
              role="alert"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {questions.map((question, index) => (
              <fieldset key={question.id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow">
                <legend className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 md:text-xl">Questão {index + 1}</h3>
                  <p className="text-base text-gray-800 md:text-lg">{question.text}</p>
                  <span className="mt-2 inline-block text-xs font-medium uppercase tracking-wide text-gray-500">
                    Dimensão {question.dimension}
                  </span>
                </legend>

                <div className="flex flex-col gap-3 md:flex-row md:items-stretch md:justify-between">
                  {likertOptions.map(({ value, label }) => {
                    const inputId = `question-${question.id}-option-${value}`;
                    const isSelected = answers[question.id] === value;

                    return (
                      <label
                        key={value}
                        htmlFor={inputId}
                        className={`flex flex-1 cursor-pointer flex-col items-center rounded-xl border px-3 py-3 text-center text-sm transition duration-200 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-200 md:max-w-[150px] ${
                          isSelected ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600'
                        }`}
                      >
                        <span className="text-sm font-semibold">{value}</span>
                        <span className="mt-1 text-xs md:text-sm">{label}</span>
                        <input
                          id={inputId}
                          type="radio"
                          name={`question_${question.id}`}
                          value={value}
                          checked={isSelected}
                          onChange={() => handleAnswerChange(question.id, value)}
                          className="sr-only"
                          required
                        />
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ))}

            <div className="text-center pt-2">
              <button
                type="submit"
                disabled={answeredCount !== questions.length || isSubmitting}
                className="inline-flex items-center justify-center rounded-full bg-blue-600 px-8 py-3 font-semibold text-white shadow-lg transition duration-300 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {isSubmitting ? 'Enviando...' : 'Finalizar Teste'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
