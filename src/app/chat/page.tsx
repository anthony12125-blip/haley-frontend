'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { sendMessageToHaley } from '@/lib/haleyApi';
import ChatInput from '@/components/ChatInput';
import MessageBubble from '@/components/MessageBubble';
import SidebarHistory from '@/components/SidebarHistory';
import ConjureAnimation from '@/components/ConjureAnimation';
import { LogOut, Menu, X } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ChatPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [conjureActive, setConjureActive] = useState(false);
  const [conjureData, setConjureData] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setShowSidebar(false);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (message: string, files?: File[]) => {
    if (!user) return;

    setMessages(prev => [...prev, {
      role: 'user',
      content: message,
      timestamp: new Date(),
    }]);

    setIsSending(true);
    try {
      const idToken = await user.getIdToken();
      const response = await sendMessageToHaley(message, user, idToken, files);

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.reply,
        timestamp: new Date(),
      }]);

      // Trigger magic window animation if present
      if (response.magic_window) {
        setConjureData(response.magic_window);
        setConjureActive(true);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsSending(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-haley-primary text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="h-screen flex">
      {/* Conjure Animation Overlay */}
      <ConjureAnimation
        active={conjureActive}
        animationType={conjureData?.animation}
        content={conjureData?.content}
        onComplete={() => setConjureActive(false)}
      />

      {/* Desktop Sidebar */}
      {!isMobile && (
        <SidebarHistory
          onSelectConversation={(id) => console.log('Select', id)}
          onNewChat={() => setMessages([])}
        />
      )}

      {/* Mobile Sidebar */}
      {isMobile && showSidebar && (
        <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setShowSidebar(false)}>
          <div
            className="w-64 h-full glass"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 flex justify-between items-center border-b border-white/10">
              <h2 className="font-bold">Conversations</h2>
              <button onClick={() => setShowSidebar(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <SidebarHistory
              onSelectConversation={(id) => {
                console.log('Select', id);
                setShowSidebar(false);
              }}
              onNewChat={() => {
                setMessages([]);
                setShowSidebar(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="glass border-b border-white/10 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isMobile && (
              <button
                onClick={() => setShowSidebar(true)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <h1 className="text-xl font-bold bg-gradient-to-r from-haley-primary to-haley-accent bg-clip-text text-transparent">
              Haley
            </h1>
          </div>
          <button
            onClick={handleSignOut}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Sign out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="h-full flex items-center justify-center text-center">
              <div>
                <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-haley-primary to-haley-accent bg-clip-text text-transparent">
                  Hello! I'm Haley
                </h2>
                <p className="text-gray-400">How can I assist you today?</p>
              </div>
            </div>
          )}
          {messages.map((message, index) => (
            <MessageBubble
              key={index}
              message={message.content}
              isUser={message.role === 'user'}
              timestamp={message.timestamp}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <ChatInput onSendMessage={handleSendMessage} disabled={isSending} />
      </div>
    </div>
  );
}
