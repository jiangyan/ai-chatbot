'use client';

import { useChat, Message } from 'ai/react';
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

      if (streamData.content !== undefined) {
        if (!currentAssistantMessageId.current) {
          currentAssistantMessageId.current = Date.now().toString();
          setMessages(prev => {
            if (prev.some(msg => msg.id === currentAssistantMessageId.current)) {
              return prev;
            }
            const newMessage: Message = {
              id: currentAssistantMessageId.current!,
              role: 'assistant',
              content: streamData.content,
              createdAt: new Date()
            };
            return [...prev, newMessage];
          });
        } else {
          setMessages(prev => {
            const newMessages = [...prev];
            const index = newMessages.findIndex(msg => msg.id === currentAssistantMessageId.current);
            if (index === -1) return prev;

            const updatedMessage: Message = {
              ...newMessages[index],
              content: streamData.content || ''
            };
            newMessages[index] = updatedMessage;
            return newMessages;
          });
        }
      }
    }
  }, [dataStream, setMessages, setUserMessageIdFromServer]);

  return null;
}
