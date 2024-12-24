import { DoubaoClient } from './client';

type DoubaoParams = {
  id: string;
};

export default async function DoubaoPage({ params }: { params: DoubaoParams }) {
  return <DoubaoClient params={params} />;
} 