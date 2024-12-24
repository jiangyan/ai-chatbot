import { OpenAI } from 'openai';

export const maxDuration = 60;

export async function POST(request: Request): Promise<Response> {
  try {
    const { messages } = await request.json();

    // Set headers for streaming
    const headers = new Headers();
    headers.set('Content-Type', 'text/event-stream');
    headers.set('Cache-Control', 'no-cache');
    headers.set('Connection', 'keep-alive');

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const openai = new OpenAI({
            apiKey: process.env.ARK_API_KEY,
            baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
          });

          const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: messages,
            stream: true,
          });

          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content || '';
            const data = `data: ${JSON.stringify({ content })}\n\n`;
            controller.enqueue(new TextEncoder().encode(data));
          }

          controller.close();
        } catch (error: any) {
          console.error('Error:', error);
          const errorMessage = error?.message || 'An unknown error occurred';
          const errorData = `data: ${JSON.stringify({ error: errorMessage })}\n\n`;
          controller.enqueue(new TextEncoder().encode(errorData));
          controller.close();
        }
      },
    });

    return new Response(stream, { headers });
  } catch (error: any) {
    console.error('Error:', error);
    const errorMessage = error?.message || 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 