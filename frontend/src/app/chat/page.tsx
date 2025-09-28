'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Interface para a estrutura de uma mensagem
interface Message {
  message: string;
  is_user: boolean;
  timestamp: string;
}

// Página de chat com a IA
export default function Chat() {
  // Estados para as mensagens, nova mensagem e roteador
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
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
      const response = await fetch('/api/chat-history', {
        headers: {
          'user-id': userId,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
        scrollToBottom();
      } else {
        // Lidar com erro
      }
    } catch (error) {
      // Lidar com erro
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

    // Adiciona a mensagem do usuário à lista de mensagens
    const userMessage: Message = {
      message: newMessage,
      is_user: true,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setNewMessage('');

    try {
      // Envia a mensagem para a API
      const response = await fetch('/api/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: parseInt(userId), message: newMessage }),
      });

      if (response.ok) {
        // Recarrega as mensagens para obter a resposta da IA
        setTimeout(loadMessages, 500);
      } else {
        // Lidar com erro
      }
    } catch (error) {
      // Lidar com erro
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="bg-white p-4 border-b shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800 text-center">Chat com IA</h1>
      </header>

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
