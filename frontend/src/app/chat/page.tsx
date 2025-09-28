'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Message {
  message: string;
  is_user: boolean;
  timestamp: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  const loadMessages = async () => {
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
        setError('Failed to fetch chat history');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

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
        setError('Failed to send message');
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
            <h2 className="text-2xl font-bold">AI Chat - Self Discovery Guide</h2>
            <p className="text-gray-600">Explore your personality and receive personalized guidance</p>
          </div>

          <div className="bg-white shadow-md rounded">
            <div className="p-4 border-b">
              <h5 className="font-bold">Chat with AI</h5>
            </div>
            <div ref={messagesContainerRef} className="p-4 h-96 overflow-y-auto">
              {messages.map((msg, index) => (
                <div key={index} className={`mb-2 ${msg.is_user ? 'text-right' : 'text-left'}`}>
                  <div
                    className={`inline-block p-2 rounded-lg max-w-xs ${msg.is_user ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                    {msg.message}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t">
              <form onSubmit={handleSendMessage} className="flex">
                <input
                  type="text"
                  className="flex-grow border rounded-l-lg p-2"
                  placeholder="Type your message here..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold p-2 rounded-r-lg">
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
