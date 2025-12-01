'use client';

interface MessageBubbleProps {
  message: string;
  isUser: boolean;
  timestamp: Date;
}

export default function MessageBubble({ message, isUser, timestamp }: MessageBubbleProps) {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-haley-primary text-white'
            : 'glass text-white border border-haley-secondary/30'
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message}</p>
        <span className="text-xs opacity-50 mt-1 block">
          {timestamp.toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}
