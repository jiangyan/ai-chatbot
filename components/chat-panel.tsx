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

  const convertToSupportedFormat = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          // Remove the data URL prefix if present
          const base64Data = reader.result.replace(/^data:image\/\w+;base64,/, '');
          resolve(base64Data);
        } else {
          reject(new Error('Failed to convert image'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read image'));
      reader.readAsDataURL(file);
    });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file');
      }

      // Convert to supported format
      const base64Data = await convertToSupportedFormat(file);

      // Create message content in the correct format
      const content = [
        {
          type: 'text',
          text: input || 'What can you tell me about this image?'
        },
        {
          type: 'image_url',
          image_url: {
            url: `data:${file.type};base64,${base64Data}`
          }
        }
      ];

      // Send the message to the API
      const response = await fetch('/api/doubao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
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
      setUserMessageId(Date.now().toString());
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try a different image or format.');
    }
  };

  return (
    <div className="flex items-center justify-between w-full gap-2 p-4">
      <input
        type="file"
        accept="image/jpeg,image/png"
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