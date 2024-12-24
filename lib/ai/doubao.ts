import OpenAI from 'openai';
import type { Attachment } from 'ai';

console.log('Initializing doubao client with config:', {
  apiKey: process.env.ARK_API_KEY ? '***' : undefined,
  baseURL: 'https://ark.cn-beijing.volces.com/api/v3'
});

// Initialize the doubao client with custom configuration
export const doubaoClient = new OpenAI({
  apiKey: process.env.ARK_API_KEY,
  baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
});

type TextContent = {
  type: 'text';
  text: string;
};

type ImageContent = {
  type: 'image_url';
  image_url: {
    url: string;
  };
};

type MessageContent = TextContent | ImageContent;

type ContentItem = {
  type: 'text' | 'image';
  text?: string;
  image?: string;
};

// Function to convert URL to base64
export async function convertImageUrlToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    return `data:${contentType};base64,${buffer.toString('base64')}`;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
}

// Function to process image attachments
export const processImageAttachments = async (attachments: Attachment[]): Promise<ImageContent[]> => {
  console.log('Processing attachments:', attachments);
  try {
    const processedAttachments = await Promise.all(
      attachments
        .filter((attachment): attachment is Attachment & { contentType: string } => 
          attachment.contentType?.startsWith('image/') ?? false
        )
        .map(async attachment => {
          // Safely extract URL
          let imageUrl = '';
          try {
            if (typeof attachment.url === 'string') {
              imageUrl = attachment.url;
            } else if (attachment.url && typeof attachment.url === 'object') {
              const urlObj = attachment.url as { href?: string };
              if (urlObj.href) {
                imageUrl = urlObj.href;
              }
            }
          } catch (e) {
            console.error('Error processing attachment URL:', e);
            return null;
          }

          if (!imageUrl) {
            console.error('Could not extract URL from attachment:', attachment);
            return null;
          }

          try {
            // Convert URL to base64
            const base64Url = await convertImageUrlToBase64(imageUrl);
            return {
              type: 'image_url' as const,
              image_url: {
                url: base64Url
              }
            };
          } catch (e) {
            console.error('Error converting image to base64:', e);
            return null;
          }
        })
    );

    return processedAttachments.filter((content): content is ImageContent => content !== null);
  } catch (error) {
    console.error('Error processing image attachments:', error);
    return [];
  }
};

// Function to create message content with text and images
export const createMessageContent = async (text: string, attachments: Attachment[] = []): Promise<MessageContent[]> => {
  console.log('Creating message content:', { text, attachments });
  
  try {
    // Always create an array format for consistency
    const content: MessageContent[] = [{ type: 'text', text }];
    
    if (attachments.length > 0) {
      const processedAttachments = await processImageAttachments(attachments);
      console.log('Processed attachments:', processedAttachments);
      if (processedAttachments.length > 0) {
        content.push(...processedAttachments);
      }
    }
    
    console.log('Final content:', content);
    return content;
  } catch (error) {
    console.error('Error creating message content:', error);
    // Fallback to just text if there's an error
    return [{ type: 'text', text }];
  }
};

// Function to handle streaming responses
export async function* handleStreamingResponse(response: Response) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';
  const messageId = generateUUID();

  // First yield the message ID
  yield { type: 'assistant-message-id', content: messageId };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        yield { type: 'done', content: '' };
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim() === '') continue;
        if (!line.startsWith('data: ')) continue;
        
        const data = line.slice(6);
        if (data === '[DONE]') continue;
        
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content || '';
          if (content) {
            yield { type: 'text', content };
          }
        } catch (e) {
          console.error('Error parsing stream data:', e);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// Helper function to generate UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Function to create streaming chat completion
export const createStreamingChatCompletion = async (messages: any[], options: any = {}) => {
  try {
    console.log('Creating streaming chat completion with messages:', messages);
    
    // Transform messages to match Volcengine API format
    const transformedMessages = messages.map(msg => {
      // If content is an array (multimodal message)
      if (Array.isArray(msg.content)) {
        const transformedContent = msg.content.map((item: ContentItem) => {
          if (item.type === 'text') {
            return {
              type: 'text',
              text: item.text
            };
          } else if (item.type === 'image') {
            return {
              type: 'image_url',
              image_url: {
                url: item.image
              }
            };
          }
          return item; // Keep other types as is
        });
        return {
          role: msg.role,
          content: transformedContent
        };
      }
      
      // If content is a string (text-only message)
      return {
        role: msg.role,
        content: [{
          type: 'text',
          text: msg.content
        }]
      };
    });

    console.log('Sending request to Volcengine API with payload:', {
      messages: transformedMessages,
      model: options.model || 'ep-20241223220835-p7wpl',
      stream: true,
      temperature: 0.7,
      max_tokens: 2000
    });

    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ARK_API_KEY}`,
      },
      body: JSON.stringify({
        messages: transformedMessages,
        model: options.model || 'ep-20241223220835-p7wpl',
        stream: true,
        temperature: 0.7,
        max_tokens: 2000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Doubao API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
    }

    return handleStreamingResponse(response);
  } catch (error) {
    console.error('Error in createStreamingChatCompletion:', error);
    throw error;
  }
}; 