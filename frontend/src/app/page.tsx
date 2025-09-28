'use client';

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <main className="container mx-auto p-4">
      <div className="flex justify-center">
        <div className="w-full max-w-3xl">
          <div className="text-center mb-5">
            <h1 className="text-4xl font-bold">Welcome to MTBI Personality Test</h1>
            <p className="text-xl text-gray-600 mt-2">Discover your personality type and embark on a journey of self-discovery</p>
          </div>

          <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
            <h3 className="text-2xl font-bold mb-2">What is the MTBI Test?</h3>
            <p className="text-gray-700">
              The Myers-Briggs Type Indicator (MBTI) is a psychological assessment that categorizes personality types based on four key dimensions:
            </p>
            <ul className="list-disc list-inside mt-2 text-gray-700">
              <li><strong>Extraversion (E) vs. Introversion (I):</strong> How you direct your energy</li>
              <li><strong>Sensing (S) vs. Intuition (N):</strong> How you take in information</li>
              <li><strong>Thinking (T) vs. Feeling (F):</strong> How you make decisions</li>
              <li><strong>Judging (J) vs. Perceiving (P):</strong> How you approach the outside world</li>
            </ul>
            <p className="text-gray-700 mt-2">
              After completing the test, you'll receive your personality type and can chat with our AI to explore what it means for your personal growth and self-understanding.
            </p>
          </div>

          <div className="text-center mt-4">
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg"
              onClick={() => router.push('/register')}
            >
              Start Your Journey
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
