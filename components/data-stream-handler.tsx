'use client';

import { useChat } from 'ai/react';
import { useEffect, useRef } from 'react';
import { useUserMessageId } from '@/hooks/use-user-message-id';

interface StreamData {
  content?: string;
  error?: string;
}

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
      if (!delta || typeof delta !== 'object') continue;

      const streamData = delta as StreamData;

      if (streamData.error) {
        console.error('Stream error:', streamData.error);
        continue;
      }

      if (streamData.content) {
        if (!currentAssistantMessageId.current) {
          currentAssistantMessageId.current = Date.now().toString();
          setMessages(prev => {
            if (prev.some(msg => msg.id === currentAssistantMessageId.current)) {
              return prev;
            }
            return [...prev, {
              id: currentAssistantMessageId.current!,
              role: 'assistant',
              content: streamData.content,
              createdAt: new Date()
            }];
          });
        } else {
          setMessages(prev => {
            const newMessages = [...prev];
            const index = newMessages.findIndex(msg => msg.id === currentAssistantMessageId.current);
            if (index === -1) return prev;

            newMessages[index] = {
              ...newMessages[index],
              content: streamData.content || ''
            };
            return newMessages;
          });
        }
      }
    }
  }, [dataStream, setMessages, setUserMessageIdFromServer]);

  return null;
}
