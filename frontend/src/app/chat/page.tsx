'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

// Interface para a estrutura de uma mensagem
interface Message {
  message: string;
  is_user: boolean;
  timestamp: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

// Página de chat com a IA
export default function Chat() {
  // Estados para as mensagens, nova mensagem e roteador
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const router = useRouter();
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Função para rolar para o final do container de mensagens
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  // Função para carregar as mensagens do histórico
  const loadMessages = useCallback(async () => {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      router.push('/register');
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/chat/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
        scrollToBottom();
      } else {
        console.error('Failed to load messages');
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, [router]);

  // Efeitos para carregar as mensagens e rolar para o final
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Função para lidar com o envio de uma nova mensagem
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const userId = localStorage.getItem('user_id');
    if (!userId) {
      router.push('/register');
      return;
    }

    const userMessage: Message = {
      message: newMessage,
      is_user: true,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setNewMessage('');

    try {
      const response = await fetch(`${BACKEND_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: parseInt(userId), message: newMessage }),
      });

      if (response.ok) {
        const aiMessage = await response.json();
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        console.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Função para salvar a chave da API da OpenAI
  const handleSaveApiKey = async () => {
    const userId = localStorage.getItem('user_id');
    if (!userId || !openaiApiKey.trim()) {
      alert('Por favor, insira uma chave de API válida.');
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/users/${userId}/openai-key`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ openai_api_key: openaiApiKey }),
      });

      if (response.ok) {
        alert('Chave de API da OpenAI salva com sucesso!');
        setOpenaiApiKey('');
      } else {
        const errorData = await response.json();
        alert(`Falha ao salvar a chave de API: ${errorData.detail || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Error saving API key:', error);
      alert('Ocorreu um erro ao salvar a chave de API.');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Navbar />
      <main ref={messagesContainerRef} className="flex-1 p-6 overflow-y-auto">
        <div className="space-y-6 max-w-4xl mx-auto">
          {messages.map((msg, index) => (
            <div key={index} className={`flex items-start gap-4 ${msg.is_user ? 'justify-end' : ''}`}>
              <div className={`p-4 rounded-lg max-w-lg ${msg.is_user ? 'bg-blue-600 text-white' : 'bg-white shadow-md'}`}>
                <p>{msg.message}</p>
                <div className={`text-xs mt-1 ${msg.is_user ? 'text-blue-100' : 'text-gray-500'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="bg-white p-4 border-t shadow-inner">
        <div className="max-w-4xl mx-auto">
          <div className="mb-4 flex items-center">
            <input
              type="password"
              className="flex-grow border rounded-full py-3 px-5 mr-4 focus:outline-none focus:ring-2 focus:ring-green-600 shadow-sm"
              placeholder="Insira sua chave de API da OpenAI"
              value={openaiApiKey}
              onChange={(e) => setOpenaiApiKey(e.target.value)}
            />
            <button onClick={handleSaveApiKey} className="bg-green-600 hover:bg-green-700 text-white font-bold p-3 rounded-full transition duration-300 ease-in-out shadow-lg">
              Salvar Chave
            </button>
          </div>
          <form onSubmit={handleSendMessage} className="flex items-center">
            <input
              type="text"
              className="flex-grow border rounded-full py-3 px-5 mr-4 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
              placeholder="Digite sua mensagem..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-3 rounded-full transition duration-300 ease-in-out shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </form>
        </div>
      </footer>
    </div>
  );
}