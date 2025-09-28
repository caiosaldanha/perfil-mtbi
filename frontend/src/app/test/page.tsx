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
          setError('Failed to fetch questions');
        }
      } catch (error) {
        setError('An unexpected error occurred');
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
      setError('Please answer all questions');
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
        setError(errorData.error || 'Failed to submit test');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    }
  };

  return (
    <main className="container mx-auto p-4">
      <div className="flex justify-center">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold">MTBI Personality Test</h2>
            <p className="text-gray-600">Answer each question honestly based on how you naturally behave</p>
          </div>

          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>}

          <form onSubmit={handleSubmit}>
            {questions.map((question) => (
              <div key={question.id} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
                <h6 className="font-bold">Question {question.id}</h6>
                <p className="text-gray-700">{question.text}</p>

                <div className="flex justify-between mt-4">
                  <span className="text-sm text-gray-600">Strongly Disagree</span>
                  <span className="text-sm text-gray-600">Strongly Agree</span>
                </div>

                <div className="flex justify-between mt-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <div key={value} className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name={`question_${question.id}`}
                        id={`q${question.id}_${value}`}
                        value={value}
                        onChange={() => handleAnswerChange(question.id, value)}
                        required
                      />
                      <label className="form-check-label" htmlFor={`q${question.id}_${value}`}>
                        {value}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="text-center">
              <button type="submit" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                Submit Test
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
