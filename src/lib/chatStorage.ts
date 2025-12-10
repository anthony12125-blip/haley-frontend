// src/lib/chatStorage.ts
// Firestore chat persistence service

import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, orderBy, deleteDoc, Timestamp } from 'firebase/firestore';
import { app } from './firebaseClient';
import type { Message, ConversationHistory } from '@/types';

const db = getFirestore(app);

export interface ChatDocument {
  id: string;
  title: string;
  messages: Message[];
  timestamp: Date;
  lastActive: Date;
  messageCount: number;
  justiceMode: string | null;
  userId: string;
}

/**
 * Save or update a chat conversation
 */
export async function saveChat(
  userId: string,
  chatId: string,
  messages: Message[],
  justiceMode: string | null = null
): Promise<void> {
  if (!userId) throw new Error('User ID required');
  
  const chatRef = doc(db, 'users', userId, 'chats', chatId);
  
  // Get existing chat to preserve creation timestamp
  let timestamp = new Date();
  try {
    const existingChat = await getDoc(chatRef);
    if (existingChat.exists()) {
      const data = existingChat.data();
      timestamp = data.timestamp?.toDate() || timestamp;
    }
  } catch (error) {
    console.log('Creating new chat');
  }
  
  // Generate title from first user message
  const firstUserMessage = messages.find(m => m.role === 'user');
  const title = firstUserMessage 
    ? firstUserMessage.content.slice(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '')
    : 'New Chat';
  
  const chatData: Partial<ChatDocument> = {
    id: chatId,
    title,
    messages: messages.map(msg => ({
      ...msg,
      timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp)
    })),
    timestamp,
    lastActive: new Date(),
    messageCount: messages.filter(m => m.role !== 'system').length,
    justiceMode,
    userId,
  };
  
  await setDoc(chatRef, chatData);
}

/**
 * Load a specific chat
 */
export async function loadChat(userId: string, chatId: string): Promise<Message[] | null> {
  if (!userId) return null;
  
  try {
    const chatRef = doc(db, 'users', userId, 'chats', chatId);
    const chatDoc = await getDoc(chatRef);
    
    if (chatDoc.exists()) {
      const data = chatDoc.data() as ChatDocument;
      return data.messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp)
      }));
    }
    return null;
  } catch (error) {
    console.error('Error loading chat:', error);
    return null;
  }
}

/**
 * Load all chats for a user
 */
export async function loadAllChats(userId: string): Promise<ConversationHistory[]> {
  if (!userId) return [];
  
  try {
    const chatsRef = collection(db, 'users', userId, 'chats');
    const q = query(chatsRef, orderBy('lastActive', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data() as ChatDocument;
      return {
        id: data.id,
        title: data.title,
        lastMessage: data.messages[data.messages.length - 1]?.content || '',
        timestamp: data.timestamp instanceof Date ? data.timestamp : data.timestamp?.toDate() || new Date(),
        lastActive: data.lastActive instanceof Date ? data.lastActive : data.lastActive?.toDate() || new Date(),
        messageCount: data.messageCount,
        justiceMode: data.justiceMode,
      };
    });
  } catch (error) {
    console.error('Error loading chats:', error);
    return [];
  }
}

/**
 * Delete a chat
 */
export async function deleteChat(userId: string, chatId: string): Promise<void> {
  if (!userId) return;
  
  try {
    const chatRef = doc(db, 'users', userId, 'chats', chatId);
    await deleteDoc(chatRef);
  } catch (error) {
    console.error('Error deleting chat:', error);
    throw error;
  }
}

/**
 * Format relative time for last active
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}
