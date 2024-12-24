'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { SparklesIcon, UserIcon, ImageIcon } from '@/components/icons';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

interface DoubaoPageProps {
  params: {
    id: string;
  };
}

export default function DoubaoChat({ params }: DoubaoPageProps) {
  const [messages, setMessages] = useState<Array<{
    role: 'user' | 'assistant';
    content: any;
  }>>([]);
  const [input, setInput] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isStreaming || messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, isStreaming]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        console.error('Invalid file type');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string' && reader.result.startsWith('data:image/')) {
          setImage(reader.result);
        } else {
          console.error('Invalid image data format');
          setImage(null);
        }
      };
      reader.onerror = () => {
        console.error('Error reading file');
        setImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if ((!input.trim() && !image) || isStreaming) return;

    const newMessage = {
      role: 'user' as const,
      content: image ? [] : input.trim()
    };

    if (image) {
      if (input.trim()) {
        (newMessage.content as any[]).push({
          type: 'text',
          text: input.trim()
        });
      } else {
        (newMessage.content as any[]).push({
          type: 'text',
          text: 'What can you tell me about this image?'
        });
      }

      (newMessage.content as any[]).push({
        type: 'image_url',
        image_url: {
          url: image
        }
      });
    }

    try {
      setIsStreaming(true);
      setMessages(prev => [...prev, newMessage]);
      setInput('');
      setImage(null);

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);

      const response = await fetch('/api/doubao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that can understand images and text.'
            },
            ...messages,
            newMessage
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const assistantMessage = {
        role: 'assistant' as const,
        content: ''
      };
      setMessages(prev => [...prev, assistantMessage]);

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const { content, error } = JSON.parse(data);
            if (error) {
              console.error('Stream error:', error);
              setMessages(prev => prev.slice(0, -1));
              continue;
            }

            if (content) {
              currentText += content;
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage && lastMessage.role === 'assistant') {
                  lastMessage.content = currentText;
                }
                return newMessages;
              });
              
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }
          } catch (e) {
            console.error('Error parsing stream data:', e);
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center h-16 bg-background border-b">
        <div className="w-full max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-center gap-2 w-[calc(100%-120px)] mx-auto">
            <Image
              src="/images/doubao-vision-pro-32K.png"
              alt="Doubao Vision Pro"
              width={32}
              height={32}
            />
            <span className="text-xl font-semibold">豆包-Doubao-vision-pro-32k</span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto w-full space-y-6 px-4 py-6">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                'flex w-full items-start gap-4 p-4 rounded-lg',
                message.role === 'assistant' ? 'bg-muted' : 'bg-background'
              )}
            >
              <div className="flex-shrink-0">
                {message.role === 'assistant' ? (
                  <SparklesIcon />
                ) : (
                  <UserIcon />
                )}
              </div>
              <div className="flex-1 space-y-4">
                {Array.isArray(message.content) ? (
                  message.content.map((content, i) => (
                    content.type === 'text' ? (
                      <p key={i} className="text-sm">{content.text}</p>
                    ) : content.type === 'image_url' ? (
                      <div key={i} className="w-48 cursor-pointer" onClick={() => setPreviewImage(content.image_url.url)}>
                        <img
                          src={content.image_url.url}
                          alt="Uploaded"
                          className="rounded-lg w-full h-auto hover:opacity-90 transition-opacity"
                        />
                      </div>
                    ) : null
                  ))
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="bg-background border-t">
        <div className="max-w-2xl mx-auto p-4">
          <Card className="p-4">
            {image && (
              <div className="mb-4 w-48 mx-auto">
                <img
                  src={image}
                  alt="Preview"
                  className="rounded-lg w-full h-auto"
                />
              </div>
            )}
            <div className="flex gap-2">
              <Textarea
                placeholder="发送消息或上传图片..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                className="min-h-[60px] w-full resize-none"
                disabled={isStreaming}
              />
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="ghost"
                  className="p-0 h-auto"
                  type="button"
                >
                  <ImageIcon />
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={(!input.trim() && !image) || isStreaming}
                >
                  <SparklesIcon size={20} />
                </Button>
              </div>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              ref={fileInputRef}
              className="hidden"
            />
          </Card>
        </div>
      </footer>

      {previewImage && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh]">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
              onClick={() => setPreviewImage(null)}
            >
              Close
            </Button>
            <img
              src={previewImage}
              alt="Preview"
              className="w-full h-auto rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
} 