export interface User {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
}

export interface Video {
  id: string;
  user_id: string;
  youtube_url: string;
  title?: string;
  created_at: string;
}
