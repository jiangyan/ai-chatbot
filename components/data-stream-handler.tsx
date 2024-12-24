'use client';

import { useChat } from 'ai/react';
import { useEffect, useRef } from 'react';
import { useUserMessageId } from '@/hooks/use-user-message-id';

type DataStreamDelta = {
  type: 'user-message-id' | 'assistant-message-id' | 'text' | 'done';
  content: string;
} | null;

export function DataStreamHandler({ id }: { id: string }) {
  const { messages, setMessages, data: dataStream } = useChat({ id });
  const { setUserMessageIdFromServer } = useUserMessageId();
  const lastProcessedIndex = useRef(-1);
  const currentAssistantMessageId = useRef<string | null>(null);

  useEffect(() => {
    if (!dataStream?.length) return;

    const newDeltas = dataStream.slice(lastProcessedIndex.current + 1);
    lastProcessedIndex.current = dataStream.length - 1;

    for (const delta of newDeltas) {
      if (!delta) continue;

      if (delta.type === 'user-message-id') {
        setUserMessageIdFromServer(delta.content);
        continue;
      }

      if (delta.type === 'assistant-message-id') {
        currentAssistantMessageId.current = delta.content;
        setMessages(prev => {
          if (prev.some(msg => msg.id === delta.content)) {
            return prev;
          }
          return [...prev, {
            id: delta.content,
            role: 'assistant',
            content: '',
            createdAt: new Date()
          }];
        });
      }

      if (delta.type === 'text' && currentAssistantMessageId.current) {
        setMessages(prev => {
          const newMessages = [...prev];
          const index = newMessages.findIndex(msg => msg.id === currentAssistantMessageId.current);
          if (index === -1) return prev;

          newMessages[index] = {
            ...newMessages[index],
            content: delta.content
          };
          return newMessages;
        });
      }

      if (delta.type === 'done') {
        currentAssistantMessageId.current = null;
      }
    }
  }, [dataStream, setMessages, setUserMessageIdFromServer]);

  return null;
}
