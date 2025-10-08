export interface User {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
}

export interface Video {
  id: string;
  userId: string;
  youtubeUrl: string;
  title?: string;
  createdAt: string;
  updatedAt: string;
}
