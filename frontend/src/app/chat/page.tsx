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
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 text-white p-4 hidden md:flex flex-col">
        <h2 className="text-2xl font-bold mb-4">Histórico</h2>
        {/* Chat history items will go here */}
      </div>

      {/* Main chat window */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white p-4 border-b">
          <h1 className="text-2xl font-bold text-gray-800">Chat com IA</h1>
        </header>

        <main ref={messagesContainerRef} className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-6">
            {messages.map((msg, index) => (
              <div key={index} className={`flex items-start gap-4 ${msg.is_user ? 'justify-end' : ''}`}>
                {!msg.is_user && (
                  <div className="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0"></div>
                )}
                <div className={`p-4 rounded-lg max-w-lg ${msg.is_user ? 'bg-blue-500 text-white' : 'bg-white'}`}>
                  <p>{msg.message}</p>
                  <div className={`text-xs mt-1 ${msg.is_user ? 'text-blue-100' : 'text-gray-500'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                {msg.is_user && (
                  <div className="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0"></div>
                )}
              </div>
            ))}
          </div>
        </main>

        <footer className="bg-white p-4 border-t">
          <form onSubmit={handleSendMessage} className="flex items-center">
            <input
              type="text"
              className="flex-grow border rounded-full py-3 px-4 mr-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Digite sua mensagem..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white font-bold p-3 rounded-full transition duration-300 ease-in-out">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
}
