import { User } from './user.model';
import { Lesson, Matiere, Classe } from './lesson.model';

/**
 * Model ForumTopic - Topic de discussion
 */
export interface ForumTopic {
  id: number;
  user_id: number;
  lesson_id?: number;
  matiere_id?: number;
  classe_id?: number;
  title: string;
  content: string;
  status: TopicStatus;
  is_resolved: boolean;
  views_count: number;
  posts_count: number;
  last_activity_at?: string;
  created_at: string;
  updated_at: string;

  // Relations
  user?: User;
  lesson?: Lesson;
  matiere?: Matiere;
  classe?: Classe;
  posts?: ForumPost[];
}

export type TopicStatus = 'open' | 'closed' | 'pinned';

export interface ForumPost {
  id: number;
  topic_id: number;
  user_id: number;
  parent_id?: number;
  content: string;
  is_solution: boolean;
  is_edited: boolean;
  edited_at?: string;
  likes_count: number;
  created_at: string;
  updated_at: string;

  // Relations
  topic?: ForumTopic;
  user?: User;
  parent?: ForumPost;
  replies?: ForumPost[];
}

export interface ForumFilters {
  lesson_id?: number;
  matiere_id?: number;
  classe_id?: number;
  status?: TopicStatus;
  resolved?: boolean;
  search?: string;
  sort?: 'activity' | 'recent' | 'popular';
  per_page?: number;
  page?: number;
}

export interface CreateTopicData {
  title: string;
  content: string;
  lesson_id?: number;
  matiere_id?: number;
  classe_id?: number;
}

export interface CreatePostData {
  content: string;
  parent_id?: number;
}

export interface UpdateTopicData {
  title?: string;
  content?: string;
}

export interface UpdatePostData {
  content: string;
}
