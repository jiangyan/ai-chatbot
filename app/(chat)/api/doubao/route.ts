import { OpenAI } from 'openai';

export const maxDuration = 60;

interface Message {
  role: string;
  content: string | Array<{
    type: string;
    text?: string;
    image_url?: {
      url: string;
    };
  }>;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const { messages } = await request.json();

    const apiKey = process.env.ARK_API_KEY;
    const baseURL = process.env.ARK_BASE_URL;

    if (!apiKey || !baseURL) {
      throw new Error('Missing API configuration. Please check your environment variables.');
    }

    // Set headers for streaming
    const headers = new Headers();
    headers.set('Content-Type', 'text/event-stream');
    headers.set('Cache-Control', 'no-cache');
    headers.set('Connection', 'keep-alive');

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const openai = new OpenAI({
            apiKey: apiKey.trim(),
            baseURL: baseURL.trim(),
          });

          // Process messages to ensure image URLs are properly formatted
          const processedMessages = messages.map((msg: Message) => {
            if (msg.content && Array.isArray(msg.content)) {
              return {
                ...msg,
                content: msg.content.map((item) => {
                  if (item.type === 'image_url' && item.image_url?.url) {
                    return {
                      type: 'image_url',
                      image_url: { url: item.image_url.url }
                    };
                  }
                  return item;
                })
              };
            }
            return msg;
          });

          const response = await openai.chat.completions.create({
            model: 'ep-20241223220835-p7wpl',
            messages: processedMessages,
            stream: true,
          });

          let isFirstChunk = true;
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              // Skip the first chunk if it looks like a GUID
              if (isFirstChunk && /^[a-f0-9-]+$/i.test(content.trim())) {
                isFirstChunk = false;
                continue;
              }
              const data = `data: ${JSON.stringify({ content })}\n\n`;
              controller.enqueue(new TextEncoder().encode(data));
              isFirstChunk = false;
            }
          }

          controller.close();
        } catch (error: any) {
          console.error('Error in stream:', error);
          const errorMessage = error?.message || 'An unknown error occurred';
          const errorData = `data: ${JSON.stringify({ error: errorMessage })}\n\n`;
          controller.enqueue(new TextEncoder().encode(errorData));
          controller.close();
        }
      },
    });

    return new Response(stream, { headers });
  } catch (error: any) {
    console.error('Error in request:', error);
    const errorMessage = error?.message || 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 