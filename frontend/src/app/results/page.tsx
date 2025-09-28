'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const descriptions: { [key: string]: string } = {
  'INTJ': 'The Architect - Strategic and independent thinkers',
  'INTP': 'The Thinker - Innovative and logical problem-solvers',
  'ENTJ': 'The Commander - Bold and strong-willed leaders',
  'ENTP': 'The Debater - Smart and curious thinkers',
  'INFJ': 'The Advocate - Creative and insightful inspirers',
  'INFP': 'The Mediator - Poetic and kind-hearted idealists',
  'ENFJ': 'The Protagonist - Charismatic and inspiring leaders',
  'ENFP': 'The Campaigner - Enthusiastic and creative free spirits',
  'ISTJ': 'The Logistician - Practical and fact-minded individuals',
  'ISFJ': 'The Protector - Warm-hearted and dedicated protectors',
  'ESTJ': 'The Executive - Excellent administrators and managers',
  'ESFJ': 'The Consul - Extraordinarily caring and social people',
  'ISTP': 'The Virtuoso - Bold and practical experimenters',
  'ISFP': 'The Adventurer - Flexible and charming artists',
  'ESTP': 'The Entrepreneur - Smart, energetic and perceptive people',
  'ESFP': 'The Entertainer - Spontaneous, energetic and enthusiastic people'
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
    setDescription(descriptions[pType] || 'Unknown personality type');
  }, [router]);

  return (
    <main className="container mx-auto p-4">
      <div className="flex justify-center">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold">Your Personality Type</h2>
          </div>

          <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 text-center">
            <h1 className="text-5xl font-bold text-blue-500">{personalityType}</h1>
            <h4 className="text-xl mt-2">{description}</h4>
            <p className="text-gray-700 mt-3">
              Congratulations! You've discovered your personality type. This is just the beginning of your journey of self-discovery.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white shadow-md rounded p-4">
              <h5 className="font-bold">What does this mean?</h5>
              <p className="text-gray-700">
                Your {personalityType} type gives insights into your natural preferences and tendencies. Understanding these can help you in relationships, career choices, and personal growth.
              </p>
            </div>
            <div className="bg-white shadow-md rounded p-4">
              <h5 className="font-bold">Continue Your Journey</h5>
              <p className="text-gray-700">
                Chat with our AI to explore your personality type in depth and receive personalized guidance for self-discovery and growth.
              </p>
            </div>
          </div>

          <div className="text-center mt-4">
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              onClick={() => router.push('/chat')}
            >
              Start AI Chat
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
