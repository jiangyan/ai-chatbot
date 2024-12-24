import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface ChatPanelProps {
  id?: string
  isLoading: boolean
  input: string
  setInput: (value: string) => void
}

export function ChatPanel({ id, isLoading, input, setInput }: ChatPanelProps) {
  const [userMessageId, setUserMessageId] = useState<string>('')

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Convert to base64 first
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string' && reader.result.startsWith('data:image/')) {
            resolve(reader.result);
          } else {
            reject(new Error('Invalid image format'));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Create message content in the correct format
      const content = [
        {
          type: 'text',
          text: input || 'What can you tell me about this image?'
        },
        {
          type: 'image_url',
          image_url: {
            url: base64
          }
        }
      ];

      // Send the message to the API
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
            {
              role: 'user',
              content
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setInput('');
      setUserMessageId(Date.now().toString()); // Use timestamp as a temporary ID
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  return (
    <div className="flex items-center justify-between w-full gap-2 p-4">
      <input
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
        id="image-upload"
      />
      <label htmlFor="image-upload">
        <Button
          type="button"
          variant="outline"
          className="cursor-pointer"
          disabled={isLoading}
        >
          Upload Image
        </Button>
      </label>
    </div>
  );
} 