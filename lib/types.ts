export interface PageProps<T = any> {
  params: T;
  searchParams: { [key: string]: string | string[] | undefined };
} 