import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, MoreVertical, Phone, Video, X } from 'lucide-react';
import { schoolService } from '../services/schoolService';
import { db } from '../services/persistence';
import { ChatMessage, UserRole } from '../types';

interface ChatWindowProps {
  currentUser: { id: string; name: string; role: UserRole };
  recipient: { id: string; name: string; role: UserRole; image?: string };
  onClose?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ currentUser, recipient, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [recipientTyping, setRecipientTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const threadId = [currentUser.id, recipient.id].sort().join(':');

  // Load initial messages and subscribe to updates
  useEffect(() => {
    loadMessages();
    
    // 1. Subscribe to DB changes (Persistent Messages)
    const subscription = db.subscribe('chats', (payload: ChatMessage) => {
       const msgThreadId = [payload.senderId, payload.receiverId].sort().join(':');
       // Only reload if it's for this thread and NOT from us (we handle our own optimistically)
       if (msgThreadId === threadId && payload.senderId !== currentUser.id) {
          loadMessages();
       }
    });

    // 2. Subscribe to Realtime Channel (Ephemeral Typing Events)
    const channel = db.getThreadChannel(threadId);
    const handleBroadcast = (payload: any) => {
      if (payload.event === 'typing' && payload.payload.userId === recipient.id) {
        setRecipientTyping(payload.payload.isTyping);
      }
    };
    
    channel.on('broadcast', { event: 'typing' }, handleBroadcast);

    return () => {
      subscription.unsubscribe();
      channel.off('broadcast', handleBroadcast);
    };
  }, [currentUser.id, recipient.id, threadId]);

  const loadMessages = async () => {
    const msgs = await schoolService.getMessagesForThread(currentUser.id, recipient.id);
    setMessages(msgs);
    scrollToBottom();
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    const textToSend = inputText;
    setInputText('');
    
    // Optimistic UI update
    const optimisticMsg: ChatMessage = {
        id: `temp-${Date.now()}`,
        senderId: currentUser.id,
        receiverId: recipient.id,
        text: textToSend,
        timestamp: new Date().toISOString(),
        isRead: false,
        type: 'Private'
    };
    setMessages(prev => [...prev, optimisticMsg]);
    scrollToBottom();

    try {
        await schoolService.sendMessage(
            currentUser.id, 
            currentUser.name, 
            currentUser.role, 
            recipient.id, 
            textToSend
        );
    } catch (err) {
        console.error("Failed to send", err);
        // In a real app, show an error state on the message
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    
    if (!isTyping) {
      setIsTyping(true);
      db.getThreadChannel(threadId).send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: currentUser.id, isTyping: true }
      });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      db.getThreadChannel(threadId).send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: currentUser.id, isTyping: false }
      });
    }, 2000);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold overflow-hidden">
            {recipient.image ? <img src={recipient.image} alt={recipient.name} className="w-full h-full object-cover" /> : recipient.name[0]}
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{recipient.name}</h3>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              {recipient.role}
              {recipientTyping && <span className="text-blue-500 font-medium animate-pulse">• Typing...</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-gray-400">
            <button className="p-2 hover:bg-gray-100 rounded-full"><Phone className="w-4 h-4" /></button>
            <button className="p-2 hover:bg-gray-100 rounded-full"><Video className="w-4 h-4" /></button>
            <button className="p-2 hover:bg-gray-100 rounded-full"><MoreVertical className="w-4 h-4" /></button>
            {onClose && <button onClick={onClose} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full"><X className="w-4 h-4" /></button>}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 custom-scrollbar">
        {messages.map((msg) => {
            const isMe = msg.senderId === currentUser.id;
            return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm ${
                        isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'
                    }`}>
                        <p className="text-sm break-words">{msg.text}</p>
                        <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                    </div>
                </div>
            );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100 flex items-center gap-2">
        <button type="button" className="p-2 text-gray-400 hover:bg-gray-50 rounded-full transition-colors">
            <Paperclip className="w-5 h-5" />
        </button>
        <input 
            type="text" 
            value={inputText}
            onChange={handleTyping}
            placeholder="Type a message..."
            className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
        />
        <button 
            type="submit" 
            disabled={!inputText.trim()}
            className="p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
        >
            <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};