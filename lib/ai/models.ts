// Define your models here.

export interface Model {
  id: string;
  label: string;
  apiIdentifier: string;
  description: string;
  route?: string;
}

export const models: Array<Model> = [
  {
    id: 'doubao',
    label: 'Doubao',
    apiIdentifier: 'ep-20241223220835-p7wpl',
    description: 'Multimodal model for text and image tasks',
    route: '/doubao/new'
  },
  {
    id: 'gpt-4o-mini',
    label: 'GPT 4o mini',
    apiIdentifier: 'gpt-4o-mini',
    description: 'Small model for fast, lightweight tasks',
  },
  {
    id: 'gpt-4o',
    label: 'GPT 4o',
    apiIdentifier: 'gpt-4o',
    description: 'For complex, multi-step tasks',
  },
] as const;

export const DEFAULT_MODEL_NAME: string = 'doubao';
