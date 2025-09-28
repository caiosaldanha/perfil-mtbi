'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email }),
      });

      if (response.ok) {
        const user = await response.json();
        localStorage.setItem('user_id', user.id);
        localStorage.setItem('user_name', user.name);
        router.push('/test');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Falha ao criar usuário');
      }
    } catch {
      setError('Ocorreu um erro inesperado');
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] py-2">
      <div className="w-full max-w-lg">
        <div className="bg-white shadow-2xl rounded-xl p-10">
          <div className="mb-6">
            <h3 className="text-center text-4xl font-bold text-gray-900">Crie sua conta</h3>
            <p className="text-center text-gray-600 mt-2">Comece sua jornada de autodescoberta</p>
          </div>
          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-800 font-semibold mb-2" htmlFor="name">
                Nome Completo
              </label>
              <input
                className="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-600"
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-gray-800 font-semibold mb-2" htmlFor="email">
                Endereço de Email
              </label>
              <input
                className="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-600"
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline w-full transition duration-300 ease-in-out shadow-lg"
                type="submit"
              >
                Cadastrar e Iniciar Teste
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
