'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Message {
  message: string;
  is_user: boolean;
  timestamp: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const router = useRouter();
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

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
        // Handle error
      }
    } catch (error) {
      // Handle error
    }
  }, [router]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      const response = await fetch('/api/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: parseInt(userId), message: newMessage }),
      });

      if (response.ok) {
        setTimeout(loadMessages, 500);
      } else {
        // Handle error
      }
    } catch (error) {
      // Handle error
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen py-12">
      <div className="w-full max-w-2xl px-4">
        <div className="bg-white shadow-lg rounded-lg">
          <div className="p-4 border-b bg-gray-50 rounded-t-lg">
            <h5 className="font-bold text-lg text-gray-800">Chat com IA</h5>
            <p className="text-sm text-gray-600">Sua jornada de autodescoberta continua</p>
          </div>
          <div ref={messagesContainerRef} className="p-6 h-96 overflow-y-auto space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.is_user ? 'justify-end' : 'justify-start'}`}>
                <div className={`px-4 py-2 rounded-lg max-w-xs lg:max-w-md ${msg.is_user ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                  <p>{msg.message}</p>
                  <div className={`text-xs mt-1 ${msg.is_user ? 'text-blue-100' : 'text-gray-500'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t bg-gray-50 rounded-b-lg">
            <form onSubmit={handleSendMessage} className="flex items-center">
              <input
                type="text"
                className="flex-grow border rounded-full py-3 px-4 mr-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Digite sua mensagem..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-full transition duration-300 ease-in-out">
                Enviar
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
